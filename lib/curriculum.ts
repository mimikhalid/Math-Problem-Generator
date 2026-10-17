// KSSR Matematik topics (simplified) for Tahun 1–6.
// Shared by the API routes (prompt + validation) and the pages (pickers).

export type Grade = 1 | 2 | 3 | 4 | 5 | 6;
export type QuestionFormat = 'numeric' | 'mcq';

export const GRADES: Grade[] = [1, 2, 3, 4, 5, 6];

export interface Topic {
    id: string;
    en: string;
    ms: string;
    grades: Grade[];
    /** Extra guidance for the AI so problems match the level. */
    guide: string;
}

export const TOPICS: Topic[] = [
    { id: 'whole_numbers', en: 'Whole Numbers', ms: 'Nombor Bulat', grades: [1, 2, 3, 4, 5, 6],
      guide: 'place value, comparing, ordering, rounding and number patterns' },
    { id: 'addition', en: 'Addition', ms: 'Tambah', grades: [1, 2, 3, 4, 5, 6],
      guide: 'addition word problems' },
    { id: 'subtraction', en: 'Subtraction', ms: 'Tolak', grades: [1, 2, 3, 4, 5, 6],
      guide: 'subtraction word problems' },
    { id: 'multiplication', en: 'Multiplication', ms: 'Darab', grades: [2, 3, 4, 5, 6],
      guide: 'multiplication word problems' },
    { id: 'division', en: 'Division', ms: 'Bahagi', grades: [2, 3, 4, 5, 6],
      guide: 'division word problems (exact division unless the level allows remainders)' },
    { id: 'mixed_operations', en: 'Mixed Operations', ms: 'Operasi Bergabung', grades: [4, 5, 6],
      guide: 'problems that need two or more different operations' },
    { id: 'fractions', en: 'Fractions', ms: 'Pecahan', grades: [2, 3, 4, 5, 6],
      guide: 'fractions of a quantity, equivalent fractions, adding/subtracting fractions' },
    { id: 'decimals', en: 'Decimals', ms: 'Perpuluhan', grades: [3, 4, 5, 6],
      guide: 'decimal place value and operations with decimals' },
    { id: 'percentages', en: 'Percentages', ms: 'Peratus', grades: [4, 5, 6],
      guide: 'percentage of a quantity, discounts, converting fractions/decimals to percentages' },
    { id: 'money', en: 'Money', ms: 'Wang', grades: [1, 2, 3, 4, 5, 6],
      guide: 'Malaysian ringgit and sen: shopping, change, saving, budgeting' },
    { id: 'time', en: 'Time', ms: 'Masa dan Waktu', grades: [1, 2, 3, 4, 5, 6],
      guide: 'reading time, duration, days/weeks/months, converting units of time' },
    { id: 'measurement', en: 'Measurement', ms: 'Ukuran', grades: [1, 2, 3, 4, 5, 6],
      guide: 'length (cm, m, km), mass (g, kg) and volume of liquid (ml, l), including conversions' },
    { id: 'shapes_space', en: 'Shapes & Space', ms: 'Ruang', grades: [3, 4, 5, 6],
      guide: 'perimeter, area and volume of simple shapes, angles' },
    { id: 'ratio', en: 'Ratio & Proportion', ms: 'Nisbah dan Kadaran', grades: [6],
      guide: 'simple ratios and direct proportion' },
    { id: 'data', en: 'Data Handling', ms: 'Pengurusan Data', grades: [4, 5, 6],
      guide: 'reading tables, average (mean), mode and range' },
];

/** Biggest whole numbers a Tahun N pupil works with, used to keep numbers age-appropriate. */
export const NUMBER_LIMIT: Record<Grade, string> = {
    1: '100',
    2: '1 000',
    3: '10 000',
    4: '100 000',
    5: '1 000 000',
    6: '10 000 000',
};

export const topicsForGrade = (grade: Grade) => TOPICS.filter(t => t.grades.includes(grade));

export const findTopic = (id: string) => TOPICS.find(t => t.id === id);

export const isGrade = (value: unknown): value is Grade => GRADES.includes(Number(value) as Grade);

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/** Shared prompt section describing the level and topic(s). */
export function levelPrompt(grade: Grade, topics: Topic[]) {
    return `The student is in Tahun ${grade} (Year ${grade}, age ${grade + 6}) of the Malaysian KSSR primary school syllabus.
        Keep whole numbers within ${NUMBER_LIMIT[grade]} and only use skills taught up to Tahun ${grade}.
        Topic(s): ${topics.map(t => `${t.en} (${t.guide})`).join('; ')}.`;
}

/** Shared prompt section describing how the answer must be shaped. */
export function formatPrompt(format: QuestionFormat) {
    return format === 'mcq'
        ? `This is an objective question: give exactly 4 answer options (without "A."/"B." prefixes), exactly one correct, with plausible wrong options based on common mistakes. "correct_option_index" is the 0-based index of the correct option.`
        : `The answer MUST be a single exact number ("final_answer"). If the topic involves units, fractions or money, phrase the question so the answer is one number (e.g. "in minutes", "in RM", "as a decimal").`;
}
