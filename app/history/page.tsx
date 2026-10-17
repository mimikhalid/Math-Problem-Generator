"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuiz, HistoryItem } from "../../lib/QuizContext";
import { Segmented } from "../../components/Pickers";
import { useLanguage } from "../../lib/i18n";

export default function HistoryPage() {
    const { t, language } = useLanguage();
    const { score, history, drillHistory } = useQuiz();
    const displayHistory = [...history].reverse();
    const displayDrills = [...drillHistory].reverse();
    const [tab, setTab] = useState<'practice' | 'drill'>('practice');

    const bestDrill = drillHistory.reduce((best, r) => Math.max(best, r.correct), 0);
    const drillAttempted = drillHistory.reduce((sum, r) => sum + r.attempted, 0);
    const drillCorrect = drillHistory.reduce((sum, r) => sum + r.correct, 0);
    const drillAccuracy = drillAttempted > 0 ? Math.round((drillCorrect / drillAttempted) * 100) : 0;
    const formatDate = (iso: string) => new Date(iso).toLocaleString(language === 'ms' ? 'ms-MY' : 'en-MY', { dateStyle: 'medium', timeStyle: 'short' });

    // History comes from localStorage, so render it only after mount
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => setHydrated(true), []);

    // Pagination
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [selectedSolution, setSelectedSolution] = useState<string[] | null>(null);
    const [showModal, setShowModal] = useState(false);

    const solved = displayHistory.filter(i => i.isCorrect).length;
    const accuracy = displayHistory.length > 0 ? Math.round((solved / displayHistory.length) * 100) : 0;

    const totalPages = Math.ceil(displayHistory.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentItems = displayHistory.slice(startIndex, startIndex + itemsPerPage);

    const openSolutionModal = (solution?: string | string[]) => {
        if (!solution) return;
        const formatted = Array.isArray(solution)
        ? solution
        : solution.split(/[\n\.]\s*/).filter((s) => s.trim().length > 0);
        setSelectedSolution(formatted);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedSolution(null);
    };

    if (!hydrated) {
        return <div className="min-h-[50vh]" />;
    }

    return (
        <div className="space-y-6">

            {/* Page Title */}
            <div>
                <h1 className="page-title">{t('historyTitle')}</h1>
            </div>

            <div className="max-w-sm">
                <Segmented<'practice' | 'drill'>
                    label=""
                    value={tab}
                    onChange={setTab}
                    columns={2}
                    options={[
                        { value: 'practice', label: `✏️ ${t('tabPractice')}` },
                        { value: 'drill', label: `⚡ ${t('tabDrill')}` },
                    ]}
                />
            </div>

            {tab === 'drill' && (
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: t('rounds'), value: drillHistory.length, color: 'text-slate-900' },
                        { label: t('bestRound'), value: bestDrill, color: 'text-green-600' },
                        { label: t('avgAccuracy'), value: `${drillAccuracy}%`, color: 'text-amber-600' },
                    ].map(stat => (
                        <div key={stat.label} className="card px-4 py-3">
                            <p className="text-xs text-slate-500">{stat.label}</p>
                            <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {displayDrills.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-4">
                    <p className="text-slate-600">{t('noDrillHistory')}</p>
                    <Link href="/drill" className="btn-primary">⚡ {t('navDrill')}</Link>
                </div>
                ) : (
                <div className="card divide-y divide-slate-100">
                    {displayDrills.map(round => {
                        const pct = round.attempted > 0 ? Math.round((round.correct / round.attempted) * 100) : 0;
                        return (
                            <div key={round.id} className="px-4 py-3 md:px-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                                <div className="flex-1 min-w-[10rem]">
                                    <p className="font-semibold text-slate-900">{t('drillRoundLine', { correct: round.correct, attempted: round.attempted })}</p>
                                    <p className="text-xs text-slate-500">{formatDate(round.date)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="chip bg-teal-50 text-teal-700">{t('gradeN', { n: round.grade })}</span>
                                    <span className="chip">{t('seconds', { n: round.seconds })}</span>
                                </div>
                                <div className="w-full sm:w-32 flex items-center gap-2">
                                    <div className="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${pct >= 80 ? 'bg-green-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs font-semibold text-slate-600 w-9 text-right">{pct}%</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
                )}
            </div>
            )}

            {tab === 'practice' && (<>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: t('totalProblems'), value: displayHistory.length, color: 'text-slate-900' },
                    { label: t('problemsSolved'), value: solved, color: 'text-green-600' },
                    { label: t('statAccuracy'), value: `${accuracy}%`, color: 'text-amber-600' },
                    { label: t('totalScore'), value: score, color: 'text-teal-700' },
                ].map(stat => (
                    <div key={stat.label} className="card px-4 py-3">
                        <p className="text-xs text-slate-500">{stat.label}</p>
                        <p className={`text-xl font-extrabold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* History Items */}
            {displayHistory.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center space-y-4">
                <p className="text-slate-600">{t('noHistory')}</p>
                <Link href="/practice" className="btn-primary">
                    ✏️ {t('navPractice')}
                </Link>
            </div>
            ) : (
            <div className="space-y-4">
                {currentItems.map((item: HistoryItem, index: number) => (
                <div key={item.id} className="card p-4 md:p-5">
                    <p className="font-bold text-base mb-2">
                    {t('problemN', { n: displayHistory.length - (startIndex + index) })}{" "}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${item.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {item.isCorrect ? t('correct') : t('incorrect')}
                    </span>
                    </p>

                    <p className="mb-1 text-sm"><strong>{t('question')}:</strong> {item.problem}</p>
                    <div className="flex flex-wrap gap-3 items-center mt-2 text-sm">
                    <p><strong>{t('yourAnswer')}</strong> {item.userAnswer}</p>
                    <span className="text-slate-400">|</span>
                    <p><strong>{t('correctAnswer')}:</strong> {item.correctAnswer}</p>
                    {item.step_by_step_solution && (
                        <>
                        <span className="text-slate-400">|</span>
                        <button
                        onClick={() => openSolutionModal(item.step_by_step_solution)}
                        className="btn-ghost py-1 text-teal-700"
                        >
                        {t('viewSolution')}
                        </button>
                        </>
                    )}
                    </div>
                </div>
                ))}

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="btn-secondary py-2"
                >
                    {t('prev')}
                </button>
                <span className="text-sm font-medium">
                    {t('pageOf', { page: currentPage, total: totalPages })}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="btn-secondary py-2"
                >
                    {t('next')}
                </button>
                </div>
            </div>
            )}
            </>)}
            {/* Solution Modal */}
            {showModal && selectedSolution && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4 relative">
                <h2 className="text-2xl font-bold text-teal-700 mb-4">{t('stepByStep')}</h2>
                <ul className="space-y-2 text-slate-700">
                {selectedSolution.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                    {step}
                    </li>
                ))}
                </ul>
                <button
                    onClick={closeModal}
                    className="btn-primary mt-6 float-right"
                >
                    {t('close')}
                </button>
                </div>
            </div>
            )}
        </div>
    );
    }
