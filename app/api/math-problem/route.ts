import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { QuestionFormat, OPTION_LETTERS, findTopic, formatPrompt, isGrade, levelPrompt } from '../../../lib/curriculum';
import { generateJson } from '../../../lib/gemini';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

type Difficulty = 'easy' | 'medium' | 'hard';
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const MIN_COUNT = 1;
const MAX_COUNT = 15;

// Writing a whole set can take ~30s; give the Vercel function room for that
export const maxDuration = 60;

interface GeneratedProblem {
    problem_text: string;
    final_answer?: number;
    options?: string[];
    correct_option_index?: number;
    hint_text: string;
    step_by_step_solution: string[];
}

/**
 * Generates a practice set: `count` problems in a single Gemini call (one call per set keeps us
 * well inside the free-tier quota), each saved to Supabase so submissions can reference it.
 */
export async function POST(req: NextRequest) {
    let body: any;
    try {
        body = await req.json();
    } catch (e) {
        return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
    }

    const difficulty: Difficulty = body.difficulty;
    const grade = Number(body.grade);
    const topic = findTopic(body.topic);
    const format: QuestionFormat = body.format === 'mcq' ? 'mcq' : 'numeric';
    const language = body.language === 'ms' ? 'ms' : 'en';
    const count = body.count === undefined ? 1 : Number(body.count);

    if (!DIFFICULTIES.includes(difficulty) || !isGrade(grade) || !topic || !topic.grades.includes(grade)
        || !Number.isInteger(count) || count < MIN_COUNT || count > MAX_COUNT) {
        return NextResponse.json({ error: `Provide a valid difficulty, grade (1-6), a topic taught in that grade and a count between ${MIN_COUNT} and ${MAX_COUNT}.` }, { status: 400 });
    }

    const languageInstruction = language === 'ms'
        ? 'Write ALL text (problems, options, hints, steps) in Bahasa Melayu (Malaysia), using Malaysian school terms.'
        : 'Write all text in English.';

    const systemPrompt =
        `You are a math problem generator for Malaysian primary school students.
        Generate exactly ${count} different word problems of ${difficulty} difficulty.
        ${levelPrompt(grade, [topic])}
        Use varied everyday Malaysian contexts (RM, local names, school, family, food) and do not repeat a context.
        ${formatPrompt(format)}
        For each problem also give a simple but helpful hint (without giving away the answer) and a step by step solution.
        "step_by_step_solution" is an ARRAY of short strings, each showing the operation and result for that step (the 'jalan kerja'), e.g.
        ["1. Find the total: 10 + 5 = 15", "2. Find the remainder: 15 - 5 = 10"].
        ${languageInstruction}
        The response MUST be a single JSON object matching the provided schema.`;

    const answerProperties = format === 'mcq'
        ? {
            options: { type: "ARRAY", items: { type: "STRING" }, description: "Exactly 4 answer options." },
            correct_option_index: { type: "INTEGER", description: "0-based index of the correct option." },
        }
        : {
            final_answer: { type: "NUMBER", description: "The single, numerical final answer." },
        };

    const payload = {
        contents: [{ parts: [{ text: `Generate ${count} new Tahun ${grade} ${topic.en} problems of ${difficulty} difficulty.` }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
                type: "OBJECT",
                properties: {
                    problems: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                problem_text: { type: "STRING", description: "The math word problem description." },
                                ...answerProperties,
                                hint_text: { type: "STRING", description: "A short, helpful hint." },
                                step_by_step_solution: {
                                    type: "ARRAY",
                                    items: { type: "STRING" },
                                    description: "Each step of the detailed solution in order."
                                },
                            },
                            required: ["problem_text", ...Object.keys(answerProperties), "hint_text", "step_by_step_solution"],
                        }
                    }
                },
                required: ["problems"]
            }
        },
    };

    const isValidProblem = (p: GeneratedProblem) => {
        const validAnswer = format === 'mcq'
            ? Array.isArray(p.options) && p.options.length === 4
                && Number.isInteger(p.correct_option_index)
                && p.correct_option_index! >= 0 && p.correct_option_index! < 4
            : typeof p.final_answer === 'number';
        return typeof p.problem_text === 'string' && typeof p.hint_text === 'string'
            && Array.isArray(p.step_by_step_solution) && validAnswer;
    };

    const data = await generateJson<{ problems: GeneratedProblem[] }>(payload,
        (d: any) => Array.isArray(d.problems) && d.problems.some(isValidProblem),
        'math-problem', count > 1 ? 45 * 1000 : undefined);

    if (!data) {
        return NextResponse.json({ error: 'Failed to generate problems. The AI service may be busy or out of quota; please try again later.' }, { status: 503 });
    }

    const problems = data.problems.filter(isValidProblem).slice(0, count).map(p => {
        // Objective questions store the option index as the answer, with the options kept in the text
        const correctAnswer = format === 'mcq' ? p.correct_option_index! : p.final_answer!;
        return {
            ...p,
            correctAnswer,
            answerLabel: format === 'mcq' ? `${OPTION_LETTERS[correctAnswer]}. ${p.options![correctAnswer]}` : String(correctAnswer),
            storedText: format === 'mcq'
                ? `${p.problem_text}\n${p.options!.map((o, i) => `${OPTION_LETTERS[i]}. ${o}`).join('\n')}`
                : p.problem_text,
        };
    });

    // Save the whole set in one insert; rows come back in the order they were sent
    const { data: rows, error } = await supabase
        .from('math_problem_sessions')
        .insert(problems.map(p => ({ problem_text: p.storedText, correct_answer: p.correctAnswer })))
        .select('id');

    if (error || !rows || rows.length !== problems.length) {
        console.error("Supabase Save Error:", error);
        return NextResponse.json({ error: 'Problems generated, but failed to save them to Supabase.' }, { status: 500 });
    }

    return NextResponse.json({
        grade,
        topic: topic.id,
        difficulty,
        format,
        problems: problems.map((p, i) => ({
            session_id: rows[i].id,
            problem_text: p.problem_text,
            format,
            options: p.options ?? null,
            final_answer: p.correctAnswer,
            answer_label: p.answerLabel,
            hint_text: p.hint_text,
            step_by_step_solution: p.step_by_step_solution,
            topic: topic.id,
            difficulty,
        })),
    });
}
