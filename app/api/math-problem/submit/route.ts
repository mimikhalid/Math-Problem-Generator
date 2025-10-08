import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const apiKey = process.env.GOOGLE_API_KEY;

interface FeedbackResponse {
    feedback_text: string;
    explanation_hint: string;
}

/**
 * Handles POST requests to submit a user's answer, check correctness, 
 * generate AI feedback, and save the submission record.
 */
export async function POST(req: NextRequest) {
    try {
        const { session_id, user_answer } = await req.json();

        if (!session_id || typeof user_answer === 'undefined') {
            return NextResponse.json({ error: 'Missing session_id or user_answer.' }, { status: 400 });
        }

        const numericalAnswer = parseFloat(user_answer);
        if (isNaN(numericalAnswer)) {
            return NextResponse.json({ error: 'User answer must be a valid number.' }, { status: 400 });
        }

        // 1. Retrieve Problem and Correct Answer from Supabase
        const { data: sessionData, error: fetchError } = await supabase
            .from('math_problem_sessions')
            .select('problem_text, correct_answer')
            .eq('id', session_id)
            .single();

        if (fetchError || !sessionData) {
            console.error('Supabase fetch error:', fetchError);
            return NextResponse.json({ error: 'Session not found or database error.' }, { status: 404 });
        }

        const { problem_text, correct_answer } = sessionData;
        
        // Convert correct answer to number for comparison (Supabase returns number/string)
        const correctAnswerNum = parseFloat(correct_answer.toString());
        
        // 2. Check Correctness
        // Simple comparison: check if the user's answer matches the correct answer
        const isCorrect = numericalAnswer === correctAnswerNum;

        // 3. Generate Personalized Feedback using Gemini AI
        let feedbackData: FeedbackResponse | null = null;
        const MAX_RETRIES = 3;

        const systemPrompt = "You are a friendly and encouraging math tutor. Provide personalized feedback to the student based on their answer. Keep the feedback concise but helpful. The response MUST be a single JSON object matching the provided schema.";

        const userQuery = `
            The original problem was: "${problem_text}"
            The correct answer is: ${correctAnswerNum}
            The user submitted the answer: ${numericalAnswer}
            
            Based on this, tell the student if they were correct or incorrect, and provide a constructive hint or encouragement.
        `;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        feedback_text: { type: "STRING", description: "Personalized feedback and encouragement." },
                        explanation_hint: { type: "STRING", description: "A brief hint or explanation of the next step, if incorrect, or a brief affirmation if correct." }
                    },
                    propertyOrdering: ["feedback_text", "explanation_hint"]
                }
            },
        };

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                const apiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
    
                if (!apiResponse.ok) {
                    throw new Error(`Gemini API returned status ${apiResponse.status}`);
                }
    
                const result = await apiResponse.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!jsonText) {
                    throw new Error("Gemini response was empty.");
                }
    
                feedbackData = JSON.parse(jsonText) as FeedbackResponse;
                break; // Success, exit loop

            } catch (error) {
                console.warn(`Gemini Feedback Attempt ${attempt + 1} failed: ${error}`);
                if (attempt === MAX_RETRIES - 1) {
                    // Fallback feedback if AI fails
                    feedbackData = { 
                        feedback_text: isCorrect ? "🎉 Great job! The backend confirmed your answer is correct." : "❌ Your answer was incorrect. Keep trying!", 
                        explanation_hint: "" 
                    };
                    break;
                }
                // Exponential backoff
                const delay = Math.pow(2, attempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        
        // 4. Save the Submission to Supabase
        const { error: submissionError } = await supabase
            .from('math_problem_submissions')
            .insert({
                session_id: session_id,
                user_answer: numericalAnswer,
                is_correct: isCorrect,
                feedback_text: `${feedbackData!.feedback_text} ${feedbackData!.explanation_hint}`,
                // created_at uses DB default
            });

        if (submissionError) {
            console.error('Supabase submission error:', submissionError);
        }

        // 5. Return the result to the frontend
        return NextResponse.json({
            is_correct: isCorrect,
            feedback_text: feedbackData!.feedback_text,
            explanation_hint: feedbackData!.explanation_hint
        });

    } catch (error) {
        console.error("General Submission Error:", error);
        return NextResponse.json({ error: 'An unexpected error occurred during submission processing.' }, { status: 500 });
    }
}
