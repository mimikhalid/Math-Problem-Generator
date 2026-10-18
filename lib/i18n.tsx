"use client";
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

export type Language = 'en' | 'ms';

const dictionary = {
    // App shell
    appName: { en: 'MathTutor MY', ms: 'MathTutor MY' },
    appTagline: { en: 'Primary Math · Year 1–6', ms: 'Matematik Tahun 1–6' },
    navHome: { en: 'Home', ms: 'Utama' },
    navPractice: { en: 'Practice', ms: 'Latihan' },
    navWorksheet: { en: 'Worksheet', ms: 'Lembaran Kerja' },
    navDrill: { en: 'Quick Drill', ms: 'Latih Tubi' },
    navHistory: { en: 'History', ms: 'Sejarah' },
    statPoints: { en: 'Points', ms: 'Mata' },
    statAccuracy: { en: 'Accuracy', ms: 'Ketepatan' },
    statSolved: { en: 'Solved', ms: 'Diselesaikan' },
    startOver: { en: 'Start Over', ms: 'Mula Semula' },
    resetConfirm: { en: 'Are you sure you want to start over? This will clear your full history and total score.', ms: 'Anda pasti mahu mula semula? Semua sejarah dan jumlah mata akan dipadam.' },
    yes: { en: 'Yes', ms: 'Ya' },
    cancel: { en: 'Cancel', ms: 'Batal' },
    close: { en: 'Close', ms: 'Tutup' },
    openMenu: { en: 'Open menu', ms: 'Buka menu' },
    language: { en: 'Language', ms: 'Bahasa' },
    developedBy: { en: 'Developed by', ms: 'Dibangunkan oleh' },
    backToTop: { en: '↑ Back to Top', ms: '↑ Ke Atas' },

    // Home
    homeEyebrow: { en: 'Primary Math · Year 1–6 · KSSR', ms: 'Matematik Tahun 1–6 · KSSR' },
    homeHeadline: { en: 'Practise maths at your own pace', ms: 'Berlatih matematik mengikut rentak sendiri' },
    homeSubtitle: { en: 'Word problems that follow the syllabus, instant checking with full working, quick drills and printable worksheets.', ms: 'Soalan berayat ikut silibus, semakan segera dengan jalan kerja penuh, latih tubi pantas dan lembaran kerja bercetak.' },
    modePracticeDesc: { en: 'Word problems in sets of 5–15, with hints and step-by-step working.', ms: 'Soalan berayat dalam set 5–15, dengan petunjuk dan jalan kerja langkah demi langkah.' },
    modeDrillDesc: { en: 'Timed mental sums to build speed and accuracy.', ms: 'Kira mental bermasa untuk tingkatkan kepantasan dan ketepatan.' },
    modeWorksheetDesc: { en: 'Print a worksheet with an answer key, or save it as PDF.', ms: 'Cetak lembaran kerja beserta skema jawapan, atau simpan sebagai PDF.' },
    open: { en: 'Open', ms: 'Buka' },
    howItWorks: { en: 'How it works', ms: 'Cara ia berfungsi' },
    step1Title: { en: 'Choose year & topic', ms: 'Pilih tahun & topik' },
    step1Body: { en: 'From Year 1 to Year 6, following KSSR topics.', ms: 'Dari Tahun 1 hingga Tahun 6, mengikut topik KSSR.' },
    step2Title: { en: 'Answer the questions', ms: 'Jawab soalan' },
    step2Body: { en: 'Written answers or objective A–D, with a hint when you need it.', ms: 'Jawapan bertulis atau objektif A–D, dengan petunjuk bila perlu.' },
    step3Title: { en: 'Learn from the working', ms: 'Belajar dari jalan kerja' },
    step3Body: { en: 'Every question shows the full working, so mistakes become lessons.', ms: 'Setiap soalan tunjuk jalan kerja penuh, supaya kesilapan jadi pelajaran.' },
    yourProgress: { en: 'Your progress', ms: 'Kemajuan anda' },
    progressLine: { en: '{n} questions answered · {pct}% correct · {rounds} drill rounds', ms: '{n} soalan dijawab · {pct}% betul · {rounds} pusingan latih tubi' },
    viewHistory: { en: 'View history', ms: 'Lihat sejarah' },

    // Shared form
    chooseGrade: { en: 'Year', ms: 'Tahun' },
    gradeN: { en: 'Year {n}', ms: 'Tahun {n}' },
    chooseTopic: { en: 'Choose Topic', ms: 'Pilih Topik' },
    chooseTopics: { en: 'Choose Topics', ms: 'Pilih Topik' },
    questionFormat: { en: 'Question Format', ms: 'Format Soalan' },
    formatNumeric: { en: 'Written answer', ms: 'Jawapan bertulis' },
    formatMcq: { en: 'Objective (A–D)', ms: 'Objektif (A–D)' },
    chooseOption: { en: 'Choose your answer:', ms: 'Pilih jawapan anda:' },
    chooseDifficulty: { en: 'Choose Difficulty', ms: 'Pilih Tahap Kesukaran' },
    easy: { en: 'Easy', ms: 'Mudah' },
    medium: { en: 'Medium', ms: 'Sederhana' },
    hard: { en: 'Hard', ms: 'Sukar' },
    addition: { en: 'Addition', ms: 'Tambah' },
    subtraction: { en: 'Subtraction', ms: 'Tolak' },
    multiplication: { en: 'Multiplication', ms: 'Darab' },
    division: { en: 'Division', ms: 'Bahagi' },

    // Practice
    practiceTitle: { en: 'Practice', ms: 'Latihan' },
    practiceSubtitle: { en: 'AI-generated word problems that follow the KSSR syllabus for your year.', ms: 'Soalan berayat yang dijana AI mengikut silibus KSSR untuk tahun anda.' },
    chooseProblemType: { en: 'Choose Problem Type', ms: 'Pilih Jenis Soalan' },
    challengeYourself: { en: 'Challenge Yourself!', ms: 'Cuba Sekarang!' },
    generating: { en: 'Generating...', ms: 'Sedang dijana...' },
    theProblem: { en: '📝 The Problem:', ms: '📝 Soalan:' },
    yourAnswer: { en: 'Your Answer:', ms: 'Jawapan Anda:' },
    enterAnswer: { en: 'Enter your answer', ms: 'Masukkan jawapan anda' },
    pleaseEnterAnswer: { en: 'Please enter your answer.', ms: 'Sila masukkan jawapan anda.' },
    submit: { en: 'Submit', ms: 'Hantar' },
    submitting: { en: 'Submitting...', ms: 'Sedang dihantar...' },
    getHint: { en: 'Get Hint', ms: 'Dapatkan Petunjuk' },
    hint: { en: 'Hint', ms: 'Petunjuk' },
    hintTryNow: { en: 'Now, try solving the problem!', ms: 'Sekarang, cuba selesaikan soalan ini!' },
    correctAnswerTitle: { en: 'Correct Answer!', ms: 'Jawapan Betul!' },
    incorrectAnswerTitle: { en: 'Incorrect Answer', ms: 'Jawapan Salah' },
    statusUpdate: { en: 'Status Update', ms: 'Status' },
    solution: { en: 'Solution', ms: 'Jalan Kerja' },
    correctAnswer: { en: 'Correct Answer', ms: 'Jawapan Betul' },
    changeSettings: { en: 'Change settings', ms: 'Tukar tetapan' },
    preparingQuestion: { en: 'Preparing your question…', ms: 'Sedang menyediakan soalan…' },
    checkAnswer: { en: 'Check Answer', ms: 'Semak Jawapan' },
    checking: { en: 'Checking…', ms: 'Menyemak…' },
    showWorking: { en: 'Show working', ms: 'Lihat jalan kerja' },
    tryAgain: { en: 'Try again', ms: 'Cuba lagi' },
    practiceEmptyTitle: { en: 'Ready to practise?', ms: 'Sedia untuk berlatih?' },
    practiceEmptyBody: { en: 'Pick your year and topic, then press the button. Each question comes with a hint and full working.', ms: 'Pilih tahun dan topik, kemudian tekan butang. Setiap soalan disertakan petunjuk dan jalan kerja penuh.' },
    sessionTally: { en: '{correct} of {total} correct this session', ms: '{correct} daripada {total} betul sesi ini' },
    numberOfQuestions: { en: 'Number of Questions', ms: 'Bilangan Soalan' },
    startSet: { en: 'Start Practice', ms: 'Mula Latihan' },
    preparingSet: { en: 'Preparing {n} questions…', ms: 'Sedang menyediakan {n} soalan…' },
    preparingSetNote: { en: 'This takes about 20–30 seconds. After that, there is no waiting between questions.', ms: 'Ini ambil masa lebih kurang 20–30 saat. Selepas itu, tiada lagi menunggu antara soalan.' },
    questionNofM: { en: 'Question {n} of {total}', ms: 'Soalan {n} daripada {total}' },
    seeResults: { en: 'See Results', ms: 'Lihat Keputusan' },
    setComplete: { en: 'Set complete!', ms: 'Set selesai!' },
    scoreOutOf: { en: '{correct} / {total} correct', ms: '{correct} / {total} betul' },
    summaryGreat: { en: 'Excellent work! You have mastered this topic.', ms: 'Syabas! Anda sudah menguasai topik ini.' },
    summaryGood: { en: 'Good effort! Review the ones you missed and try again.', ms: 'Usaha yang baik! Semak soalan yang salah dan cuba lagi.' },
    summaryKeepGoing: { en: 'Keep practising! Read the working for each question, then retry the set.', ms: 'Teruskan berlatih! Baca jalan kerja setiap soalan, kemudian ulang set ini.' },
    reviewAnswers: { en: 'Review answers', ms: 'Semak jawapan' },
    retrySet: { en: 'Retry Set', ms: 'Ulang Set' },
    newSet: { en: 'New Set', ms: 'Set Baharu' },
    praiseCorrect: { en: 'Well done, that is correct!', ms: 'Tahniah, jawapan anda betul!' },
    encourageIncorrect: { en: 'Not quite. Read the working below to see how it is solved.', ms: 'Kurang tepat. Baca jalan kerja di bawah untuk melihat cara penyelesaian.' },
    yourAnswerWas: { en: 'Your answer', ms: 'Jawapan anda' },
    nextQuestion: { en: 'Next Question →', ms: 'Soalan Seterusnya →' },
    generateFailed: { en: 'Could not generate a problem. Please try again.', ms: 'Gagal menjana soalan. Sila cuba lagi.' },

    // Worksheet
    worksheetTitle: { en: 'Printable Worksheet', ms: 'Lembaran Kerja Bercetak' },
    worksheetSubtitle: { en: 'Generate a worksheet with an answer key, then save it as a PDF or print it.', ms: 'Jana lembaran kerja beserta skema jawapan, kemudian simpan sebagai PDF atau cetak.' },
    chooseProblemTypes: { en: 'Choose Problem Types', ms: 'Pilih Jenis Soalan' },
    numberOfProblems: { en: 'Number of Problems', ms: 'Bilangan Soalan' },
    workingSpace: { en: 'Working space', ms: 'Ruang jalan kerja' },
    answerKey: { en: 'Answer Key', ms: 'Skema Jawapan' },
    showWorkingInKey: { en: 'Show working in answer key', ms: 'Tunjuk jalan kerja dalam skema' },
    generateWorksheet: { en: 'Generate Worksheet', ms: 'Jana Lembaran Kerja' },
    generateNewWorksheet: { en: 'Generate New Worksheet', ms: 'Jana Lembaran Baharu' },
    generatingProblems: { en: 'Generating {n} problems...', ms: 'Sedang menjana {n} soalan...' },
    pickOneType: { en: 'Pick at least one topic', ms: 'Pilih sekurang-kurangnya satu topik' },
    worksheetFailed: { en: 'Could not generate the worksheet. Please try again.', ms: 'Gagal menjana lembaran kerja. Sila cuba lagi.' },
    downloadPdf: { en: '⬇️ Download PDF / Print', ms: '⬇️ Muat Turun PDF / Cetak' },
    saveAsPdfTip: { en: 'In the print dialog, choose "Save as PDF" as the destination to download a PDF.', ms: 'Dalam tetingkap cetak, pilih "Save as PDF" sebagai destinasi untuk muat turun PDF.' },
    worksheetHeading: { en: '{types} Worksheet', ms: 'Lembaran Kerja {types}' },
    worksheetMeta: { en: 'Year {grade} · {difficulty} · {n} questions', ms: 'Tahun {grade} · {difficulty} · {n} soalan' },
    score: { en: 'Score', ms: 'Markah' },
    name: { en: 'Name', ms: 'Nama' },
    date: { en: 'Date', ms: 'Tarikh' },
    answer: { en: 'Answer', ms: 'Jawapan' },

    // Drill
    drillTitle: { en: 'Quick Drill', ms: 'Latih Tubi' },
    drillSubtitle: { en: 'Answer as many sums as you can before time runs out. Press Enter to submit.', ms: 'Jawab seberapa banyak soalan yang boleh sebelum masa tamat. Tekan Enter untuk hantar.' },
    duration: { en: 'Time', ms: 'Masa' },
    seconds: { en: '{n} seconds', ms: '{n} saat' },
    startDrill: { en: 'Start', ms: 'Mula' },
    skip: { en: 'Skip', ms: 'Langkau' },
    timeLeft: { en: 'Time left', ms: 'Masa tinggal' },
    streak: { en: 'Streak', ms: 'Berturut' },
    timesUp: { en: "⏰ Time's up!", ms: '⏰ Masa tamat!' },
    drillResult: { en: 'You got {correct} correct out of {total}.', ms: 'Anda betul {correct} daripada {total} soalan.' },
    bestScore: { en: 'Best score (Year {grade}, {secs}s): {best}', ms: 'Markah terbaik (Tahun {grade}, {secs}s): {best}' },
    newBest: { en: '🏆 New best score!', ms: '🏆 Markah terbaik baharu!' },
    playAgain: { en: 'Play Again', ms: 'Main Lagi' },
    stop: { en: 'Stop', ms: 'Berhenti' },

    // History
    tabPractice: { en: 'Practice', ms: 'Latihan' },
    tabDrill: { en: 'Quick Drill', ms: 'Latih Tubi' },
    rounds: { en: 'Rounds', ms: 'Pusingan' },
    bestRound: { en: 'Best', ms: 'Terbaik' },
    avgAccuracy: { en: 'Avg. accuracy', ms: 'Purata ketepatan' },
    noDrillHistory: { en: 'No drill rounds yet. Try a Quick Drill!', ms: 'Belum ada pusingan latih tubi. Cuba Latih Tubi!' },
    drillRoundLine: { en: '{correct} / {attempted} correct', ms: '{correct} / {attempted} betul' },
    historyTitle: { en: 'Problem History', ms: 'Sejarah Soalan' },
    totalProblems: { en: 'Total Problems', ms: 'Jumlah Soalan' },
    problemsSolved: { en: 'Problems Solved', ms: 'Soalan Betul' },
    totalScore: { en: 'Total Score', ms: 'Jumlah Mata' },
    noHistory: { en: "You haven't completed any problems yet. Go to Practice and start solving!", ms: 'Anda belum menjawab sebarang soalan. Pergi ke Latihan dan mula menjawab!' },
    problemN: { en: 'Problem {n}', ms: 'Soalan {n}' },
    correct: { en: '✅ Correct', ms: '✅ Betul' },
    incorrect: { en: '❌ Incorrect', ms: '❌ Salah' },
    question: { en: 'Question', ms: 'Soalan' },
    viewSolution: { en: '💡 View Solution', ms: '💡 Lihat Jalan Kerja' },
    stepByStep: { en: 'Step by Step Solution', ms: 'Jalan Kerja Langkah demi Langkah' },
    prev: { en: '⬅️ Prev', ms: '⬅️ Sebelum' },
    next: { en: 'Next ➡️', ms: 'Seterusnya ➡️' },
    pageOf: { en: 'Page {page} of {total}', ms: 'Halaman {page} daripada {total}' },
} satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof dictionary;

interface LanguageContextType {
    language: Language;
    setLanguage: (language: Language) => void;
    t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>('en');

    // Read the saved choice after mount so server and client render the same first frame
    useEffect(() => {
        try {
            const saved = localStorage.getItem('language');
            if (saved === 'en' || saved === 'ms') setLanguageState(saved);
        } catch { /* storage unavailable: keep default */ }
    }, []);

    useEffect(() => {
        document.documentElement.lang = language;
    }, [language]);

    const setLanguage = useCallback((next: Language) => {
        setLanguageState(next);
        try { localStorage.setItem('language', next); } catch { /* ignore */ }
    }, []);

    const t = useCallback((key: TranslationKey, vars?: Record<string, string | number>) => {
        let text: string = dictionary[key][language];
        if (vars) {
            for (const [name, value] of Object.entries(vars)) {
                text = text.replace(`{${name}}`, String(value));
            }
        }
        return text;
    }, [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
