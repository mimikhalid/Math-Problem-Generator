import { NextRequest, NextResponse } from 'next/server';
import { QuestionFormat, Topic, findTopic, formatPrompt, isGrade, levelPrompt } from '../../../lib/curriculum';
import { generateJson } from '../../../lib/gemini';

type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

// Writing a whole worksheet can take ~30s; give the Vercel function room for that
export const maxDuration = 60;
const MIN_COUNT = 5;
const MAX_COUNT = 20;

export interface WorksheetProblem {
    problem_text: string;
    final_answer?: number;
    options?: string[];
    correct_option_index?: number;
    step_by_step_solution: string[];
}

/**
 * Generates a full worksheet (several word problems with answers) in a single Gemini call.
 * Nothing is saved to Supabase: worksheets are meant to be printed, not answered online.
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
    const count = Number(body.count);
    const format: QuestionFormat = body.format === 'mcq' ? 'mcq' : 'numeric';
    const language = body.language === 'ms' ? 'ms' : 'en';
    const topicIds: string[] = Array.isArray(body.topics) ? body.topics : [];
    const topics = topicIds.map(findTopic).filter((t): t is Topic => !!t);

    if (!DIFFICULTIES.includes(difficulty)
        || !isGrade(grade)
        || topics.length === 0 || topics.length !== topicIds.length
        || !topics.every(t => t.grades.includes(grade))
        || !Number.isInteger(count) || count < MIN_COUNT || count > MAX_COUNT) {
        return NextResponse.json({ error: `Provide difficulty, grade (1-6), at least one topic for that grade and a count between ${MIN_COUNT} and ${MAX_COUNT}.` }, { status: 400 });
    }

    const languageInstruction = language === 'ms'
        ? 'Write ALL text (problems, options and steps) in Bahasa Melayu (Malaysia), using Malaysian school terms.'
        : 'Write all text in English.';

    const systemPrompt =
        `You are a math worksheet generator for Malaysian primary school students.
        Generate exactly ${count} different word problems of ${difficulty} difficulty.
        ${levelPrompt(grade, topics)}
        Spread the problems evenly across the topics.
        Use varied, everyday Malaysian contexts (RM, shopping, school, sports, food, travel) and do not repeat the same context twice in a row.
        ${formatPrompt(format)}
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
        contents: [{ parts: [{ text: `Generate a Tahun ${grade} ${difficulty} worksheet with ${count} problems on ${topics.map(t => t.en).join(', ')}.` }] }],
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
                                step_by_step_solution: {
                                    type: "ARRAY",
                                    items: { type: "STRING" },
                                    description: "Each step of the solution in order."
                                },
                            },
                            required: ["problem_text", ...Object.keys(answerProperties), "step_by_step_solution"],
                        }
                    }
                },
                required: ["problems"]
            }
        },
    };

    const isValidProblem = (p: WorksheetProblem) =>
        typeof p.problem_text === 'string' &&
        Array.isArray(p.step_by_step_solution) &&
        (format === 'mcq'
            ? Array.isArray(p.options) && p.options.length === 4
                && Number.isInteger(p.correct_option_index) && p.correct_option_index! >= 0 && p.correct_option_index! < 4
            : typeof p.final_answer === 'number');

    const data = await generateJson<{ problems: WorksheetProblem[] }>(payload,
        (d: any) => Array.isArray(d.problems) && d.problems.some(isValidProblem), 'worksheet', 45 * 1000);

    if (!data) {
        return NextResponse.json({ error: 'Failed to generate worksheet. The AI service may be busy or out of quota; please try again later.' }, { status: 503 });
    }

    const problems = data.problems.filter(isValidProblem).slice(0, count);
    return NextResponse.json({ difficulty, grade, format, topics: topics.map(t => t.id), problems });
}
