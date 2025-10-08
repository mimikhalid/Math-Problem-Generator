"use client";
import Link from "next/link";
import { useState } from "react";
import { useQuiz, HistoryItem } from "../../lib/QuizContext";

export default function HistoryPage() {
    const { score, history } = useQuiz();
    const displayHistory = [...history].reverse();

    // Pagination setup
    const itemsPerPage = 5;
    const [currentPage, setCurrentPage] = useState(1);

    // Modal setup
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center p-4">
        <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 border border-gray-100 dark:border-gray-700">
            <div className="container mx-auto p-4">
            <Link href="/" className="text-blue-600 hover:underline mb-4 block">
                ← Back to Math Problem (Current Score: {score})
            </Link>

            <h1 className="text-3xl font-bold mb-6">Full History</h1>

            {displayHistory.length === 0 ? (
                <p className="text-gray-500">
                You haven't completed any problems yet. Go back and start solving!
                </p>
            ) : (
                <>
                <div className="space-y-6">
                    {currentItems.map((item: HistoryItem, index: number) => (
                    <div
                        key={item.id}
                        className="p-4 border rounded-lg shadow-sm bg-white dark:bg-gray-700"
                    >
                        <p className="font-semibold text-lg mb-2">
                        Problem {displayHistory.length - (startIndex + index)}
                        <span
                            className={`ml-3 px-2 py-0.5 rounded-full text-xs font-bold ${
                            item.isCorrect
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                        >
                            {item.isCorrect ? "Correct ✅" : "Incorrect ❌"}
                        </span>
                        </p>

                        <p className="mb-1">
                        <strong>Question: </strong>
                        {item.problem}
                        </p>
                        <p className="mb-1">
                        <strong>Your Answer: </strong>
                        {item.userAnswer}
                        </p>

                        {!item.isCorrect && (
                        <p className="text-sm text-red-500">
                            <strong>Correct Answer: </strong>
                            {item.correctAnswer}
                        </p>
                        )}

                        <p className="text-xs text-gray-500 mt-2">
                        Type: {item.type} | Difficulty: {item.difficulty}
                        </p>

                        {/* --- View Solution Button --- */}
                        {item.step_by_step_solution && (
                        <div className="mt-3">
                            <button
                            onClick={() =>
                                openSolutionModal(item.step_by_step_solution)
                            }
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md shadow-md transition-all"
                            >
                            View Solution 💡
                            </button>
                        </div>
                        )}
                    </div>
                    ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-center items-center gap-4 mt-8">
                    <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md font-semibold disabled:opacity-50"
                    >
                    ← Prev
                    </button>
                    <span className="text-sm">
                    Page {currentPage} of {totalPages}
                    </span>
                    <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-md font-semibold disabled:opacity-50"
                    >
                    Next →
                    </button>
                </div>
                </>
            )}
            </div>
        </div>

        {/* --- Modal for Step-by-Step Solution --- */}
        {showModal && selectedSolution && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-lg w-full mx-4 relative">
                <h2 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mb-4">
                Step by Step Solution
                </h2>

                <ul className="space-y-2 text-gray-700 dark:text-gray-200">
                {selectedSolution.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                    {step}
                    </li>
                ))}
                </ul>


                <button
                onClick={closeModal}
                className="mt-6 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold transition-all float-right"
                >
                Close
                </button>
            </div>
            </div>
        )}
        </div>
    );
}