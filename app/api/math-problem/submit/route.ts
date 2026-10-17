import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { OPTION_LETTERS } from '../../../../lib/curriculum';
import { generateJson } from '../../../../lib/gemini';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
        const { session_id, user_answer, language, format, ai_feedback } = await req.json();
        // Practice sets already include the working, so they skip the AI explanation to save quota
        const wantAiFeedback = ai_feedback !== false;

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

        // 3. Feedback. Correct answers get instant local praise; only wrong answers use a Gemini call,
        // which halves quota use (the free tier allows ~20 calls per model per day).
        const ms = language === 'ms';
        const PRAISE = ms
            ? ['🎉 Tahniah, jawapan anda betul!', '🌟 Hebat! Teruskan usaha.', '👏 Bagus sekali, jawapan tepat!', '✅ Betul! Anda semakin mahir.']
            : ['🎉 Well done, that is correct!', '🌟 Great job! Keep it up.', '👏 Excellent, spot on!', '✅ Correct! You are getting better.'];

        let feedbackData: FeedbackResponse;
        if (!wantAiFeedback && !isCorrect) {
            feedbackData = {
                feedback_text: ms ? 'Jawapan anda kurang tepat. Semak jalan kerja untuk melihat cara penyelesaian.' : 'Not quite. Check the working to see how it is solved.',
                explanation_hint: ''
            };
        } else if (isCorrect) {
            feedbackData = { feedback_text: PRAISE[Math.floor(Math.random() * PRAISE.length)], explanation_hint: '' };
        } else {
            const systemPrompt = `You are a friendly and encouraging math tutor. Provide personalized feedback to the student based on their answer. Keep the feedback concise but helpful. ${ms ? 'Write the feedback in Bahasa Melayu (Malaysia).' : 'Write the feedback in English.'} The response MUST be a single JSON object matching the provided schema.`;

            // Objective questions store the option index; describe answers by letter for the tutor
            const describe = (n: number) => format === 'mcq' ? `option ${OPTION_LETTERS[n] ?? n}` : String(n);

            const userQuery = `
                The original problem was: "${problem_text}"
                The correct answer is: ${describe(correctAnswerNum)}
                The user submitted the answer: ${describe(numericalAnswer)}

                The answer is incorrect. Explain kindly what likely went wrong and give a constructive hint, without being discouraging.
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
                            explanation_hint: { type: "STRING", description: "A brief hint or explanation of the next step." }
                        },
                        propertyOrdering: ["feedback_text", "explanation_hint"]
                    }
                },
            };

            feedbackData = await generateJson<FeedbackResponse>(payload,
                (d: any) => typeof d.feedback_text === 'string', 'feedback')
                ?? {
                    feedback_text: ms ? '❌ Jawapan anda kurang tepat. Semak jalan kerja di bawah dan cuba lagi!' : '❌ Not quite. Check the working below and try again!',
                    explanation_hint: ''
                };
        }

        // 4. Save the Submission to Supabase
        const { error: submissionError } = await supabase
            .from('math_problem_submissions')
            .insert({
                session_id: session_id,
                user_answer: numericalAnswer,
                is_correct: isCorrect,
                feedback_text: `${feedbackData.feedback_text} ${feedbackData.explanation_hint}`,
                // created_at uses DB default
            });

        if (submissionError) {
            console.error('Supabase submission error:', submissionError);
        }

        // 5. Return the result to the frontend
        return NextResponse.json({
            is_correct: isCorrect,
            feedback_text: feedbackData.feedback_text,
            explanation_hint: feedbackData.explanation_hint
        });

    } catch (error) {
        console.error("General Submission Error:", error);
        return NextResponse.json({ error: 'An unexpected error occurred during submission processing.' }, { status: 500 });
    }
}
