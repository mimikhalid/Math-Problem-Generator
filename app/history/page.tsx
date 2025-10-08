"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuiz, HistoryItem } from "../../lib/QuizContext";

export default function HistoryPage() {
    const { score, history } = useQuiz();
    const displayHistory = [...history].reverse();

    // Pagination
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Modal
    const [selectedSolution, setSelectedSolution] = useState<string[] | null>(null);
    const [showModal, setShowModal] = useState(false);

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

    return (
        <div className="min-h-screen bg-yellow-50 flex justify-center p-4">
        <div className="w-full max-w-6xl space-y-8">

            {/* Back Link */}
            <Link href="/" className="text-blue-600 hover:underline mb-2 block font-medium">
            ← Back to Math Problem
            </Link>

            {/* Page Title */}
            <h1 className="text-4xl font-extrabold text-center mb-4">Problem History</h1>

            {/* Dashboard Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-500 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center hover:scale-105 transition-transform">
                <p className="text-sm">Total Problems</p>
                <p className="text-3xl font-extrabold">{displayHistory.length}</p>
            </div>

            <div className="bg-green-500 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center hover:scale-105 transition-transform">
                <p className="text-sm">Problems Solved</p>
                <p className="text-3xl font-extrabold">{displayHistory.filter(i => i.isCorrect).length}</p>
            </div>

            <div className="bg-amber-500 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center hover:scale-105 transition-transform">
                <p className="text-sm">Accuracy</p>
                <p className="text-3xl font-extrabold">
                {displayHistory.length > 0
                    ? Math.round((displayHistory.filter(i => i.isCorrect).length / displayHistory.length) * 100)
                    : 0}%
                </p>
            </div>

            <div className="bg-purple-500 text-white rounded-xl p-6 shadow-lg flex flex-col items-center justify-center hover:scale-105 transition-transform">
                <p className="text-sm">Total Score</p>
                <p className="text-3xl font-extrabold">{score}</p>
            </div>
            </div>

            {/* History Items */}
            {displayHistory.length === 0 ? (
            <p className="text-gray-600 text-center">You haven't completed any problems yet. Go back and start solving!</p>
            ) : (
            <div className="space-y-6">
                {currentItems.map((item: HistoryItem, index: number) => (
                <div key={item.id} className="p-4 border rounded-2xl shadow-md bg-white hover:shadow-lg transition-shadow">
                    <p className="font-bold text-lg mb-2">
                    Problem {displayHistory.length - (startIndex + index)}{" "}
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${item.isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {item.isCorrect ? "✅ Correct" : "❌ Incorrect"}
                    </span>
                    </p>

                    <p className="mb-1 text-sm"><strong>Question:</strong> {item.problem}</p>
                    <div className="flex flex-wrap gap-3 items-center mt-2 text-sm">
                    <p><strong>Your Answer:</strong> {item.userAnswer}</p>
                    <span className="text-gray-400">|</span>
                    <p><strong>Correct Answer:</strong> {item.correctAnswer}</p>
                    <span className="text-gray-400">|</span>
                    {item.step_by_step_solution && (
                        <button
                        onClick={() => openSolutionModal(item.step_by_step_solution)}
                        className="px-3 py-1 bg-pink-500 text-white rounded-lg text-sm font-semibold hover:bg-pink-600 transition-colors"
                        >
                        💡 View Solution
                        </button>
                    )}
                    </div>
                </div>
                ))}

                {/* Pagination */}
                <div className="flex justify-center items-center gap-4 mt-6">
                <button
                    onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-blue-200 rounded-md font-semibold disabled:opacity-50 hover:bg-blue-300 transition-colors"
                >
                    ⬅️ Prev
                </button>
                <span className="text-sm font-medium">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-blue-200 rounded-md font-semibold disabled:opacity-50 hover:bg-blue-300 transition-colors"
                >
                    Next ➡️
                </button>
                </div>
            </div>
            )}
            <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-600 transition-all"
            >
            ↑ Back to Top
            </button>
            {/* Solution Modal */}
            {showModal && selectedSolution && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4 relative">
                <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">Step by Step Solution</h2>
                <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                {selectedSolution.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                    {step}
                    </li>
                ))}
                </ul>
                <button
                    onClick={closeModal}
                    className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold float-right transition-all"
                >
                    Close
                </button>
                </div>
            </div>
            )}
        </div>
        </div>
    );
    }
