import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const apiKey = process.env.GOOGLE_API_KEY;
declare const gemkick_corpus: any;

interface ProblemRequest {
    difficulty: 'easy' | 'medium' | 'hard';
    problemType: 'addition' | 'subtraction' | 'multiplication' | 'division';
}

interface MathProblemResponse {
    problem_text: string;
    final_answer: number;
    hint_text: string;
    step_by_step_solution: string[];
}

// The Google Drive URL to the syllabus
const SYLLABUS_URL = "https://drive.google.com/file/d/1nk29gckpw82fGTkZGUm7djzmkjxefqDa/view";
const FALLBACK_SYLLABUS_CONTENT = "";
/**
 * Next.js API route handler for generating math problems.
 */
export async function POST(req: NextRequest) {
    let requestData: ProblemRequest;
    try {
        const body = await req.json();
        // Validate required fields from the frontend
        if (!body.difficulty || !body.problemType) {
            return NextResponse.json({ error: 'Missing difficulty or problemType in request body.' }, { status: 400 });
        }
        requestData = body as ProblemRequest;
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }
    const { difficulty, problemType } = requestData;

    // --- 1. FETCH CONTEXT (Syllabus) FROM GOOGLE DRIVE ---
    let syllabusContext = "";
    try {
        // Runtime check for the tool's availability, as it is declared globally but needs runtime definition.
        if (typeof gemkick_corpus === 'undefined' || !gemkick_corpus.lookup_urls) {
            console.warn("The gemkick_corpus tool is not defined or available at runtime. Skipping syllabus fetch.");
        } else {
            console.log("Fetching syllabus content from Google Drive...");
            // Call the gemkick_corpus tool to fetch the file content
            const corpusResult = await gemkick_corpus.lookup_urls({ urls: [SYLLABUS_URL] });
            
            // Assuming the tool returns a structure where the content can be extracted
            if (corpusResult && corpusResult.length > 0) {
                console.log(corpusResult)
                // Extract content from the first item
                syllabusContext = corpusResult[0].content || corpusResult[0].summarized_content || "";
                if (syllabusContext.length > 5000) {
                    // Truncate long content to fit within reasonable prompt limits
                    syllabusContext = syllabusContext.substring(0, 5000) + " [CONTEXT TRUNCATED]";
                }
                console.log(`Syllabus context retrieved (length: ${syllabusContext.length})`);
            } else {
                console.warn("Syllabus lookup returned no content.");
                syllabusContext = "Syllabus context could not be loaded.";
            }
        }
    } catch (e) {
        console.error("Failed to fetch syllabus from Google Drive:", e);
        // The problem generation should still proceed, but without the syllabus context
        syllabusContext = "Syllabus context could not be loaded due to an unexpected error.";
    }


    // --- 2. CONSTRUCT PROMPTS WITH SYLLABUS CONTEXT ---
    
    // Add the fetched context to the system instruction
    const syllabusInstruction = syllabusContext 
        ? `\n\n[SYLLABUS CONTEXT]: Use the following syllabus information/topics as context to make the word problem relevant to the course content, ensuring the problem remains suitable for a 5th-grade level. \nContent: ${syllabusContext}`
        : "";

    const systemPrompt = 
        `You are a math problem generator. Generate a single word problem that is ${difficulty} difficulty, suitable for a 5th-grade student, and primarily focuses on ${problemType} while potentially including one other basic arithmetic operation.
        
        ${syllabusInstruction} // INJECTED SYLLABUS CONTEXT

        You MUST provide the problem, the exact final numerical answer, a simple but helpful hint and detailed step by step solution.
        The response MUST be a single JSON object matching the provided schema.
        
        Make sure "step_by_step_solution" is an ARRAY of short strings, each one showing the required mathematical operation and result for that step (the 'jalan kerja').
        Example (for a problem where you add 10, subtract 5, then multiply by 2):
        "step_by_step_solution": [
            "1. Start by finding the total: 10 + 5 = 15",
            "2. Find the remaining amount: 15 - 5 = 10",
            "3. Calculate the final value: 10 * 2 = 20"
        ]`;

    const userQuery = `Generate a new word problem of ${difficulty} difficulty focused on ${problemType}.`;
    
    // --- 3. EXECUTE GEMINI API CALL WITH BACKOFF ---

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    problem_text: { type: "STRING", description: "The math word problem description." },
                    final_answer: { type: "NUMBER", description: "The single, numerical final answer." },
                    hint_text: { type: "STRING", description: "A short, helpful hint for the user." },
                    step_by_step_solution: {
                        type: "ARRAY",
                        items: { type: "STRING" },
                        description: "Each step of the detailed solution in order."
                    },
                },
                propertyOrdering: ["problem_text", "final_answer", "hint_text"]
            }
        },
    };
    let problemData: MathProblemResponse | null = null;
    let sessionDocId: string | null = null; // Unused in this snippet, but kept
    const MAX_RETRIES = 5;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }

            const result = await response.json();
            const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!jsonText) {
                throw new Error("Gemini response was empty or malformed.");
            }

            // Parse and validate the structured JSON response (using the corrected Array.isArray check)
            const parsedJson = JSON.parse(jsonText);
            if (
                typeof parsedJson.problem_text === 'string' &&
                typeof parsedJson.final_answer === 'number' &&
                typeof parsedJson.hint_text === 'string' &&
                Array.isArray(parsedJson.step_by_step_solution)
            ) {
                problemData = parsedJson as MathProblemResponse;
                break; // Success, exit loop
            } else {
                throw new Error("Parsed JSON did not match expected schema with all fields.");
            }

        } catch (error) {
            console.warn(`Attempt ${attempt + 1} failed: ${error}`);
            if (attempt === MAX_RETRIES - 1) {
                return NextResponse.json({ error: 'Failed to generate math problem after multiple retries.' }, { status: 500 });
            }
            // Exponential backoff: 1s, 2s, 4s, 8s...
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    if (!problemData) {
        return NextResponse.json({ error: 'Failed to process generated content.' }, { status: 500 });
    }

    // 2. Save the generated problem to Supabase
    try {
        const { data, error } = await supabase
            .from('math_problem_sessions')
            .insert({
                problem_text: problemData.problem_text,
                correct_answer: problemData.final_answer, // Mapping model output to schema
            })
            .select('id') // Request the auto-generated primary key (session_id)
            .single();

        if (error) {
            throw new Error(`Supabase Insert Error: ${error.message}`);
        }

        // The ID of the newly inserted row is the session ID
        sessionDocId = data.id;

    } catch (error) {
        console.error("Supabase Save Error:", error);
        // Return the problem data even if saving fails, but with an error message
        return NextResponse.json({
            problem_text: problemData.problem_text,
            final_answer: problemData.final_answer,
            error: 'Problem generated, but failed to save session to Supabase.'
        }, { status: 500 });
    }

    // 3. Return the problem and session ID
    return NextResponse.json({
        problem_text: problemData.problem_text,
        final_answer: problemData.final_answer,
        session_id: sessionDocId,
        difficulty: difficulty,
        problem_type: problemType,
        hint_text: problemData.hint_text,
        step_by_step_solution: problemData.step_by_step_solution
    });
}
