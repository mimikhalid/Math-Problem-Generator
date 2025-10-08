'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuiz } from  '../lib/QuizContext';
import { useRouter } from 'next/navigation';
// --- New/Updated Interfaces ---
interface MathProblem {
  problem_text: string
  final_answer: number
  session_id: string
  problem_type: 'addition' | 'subtraction' | 'multiplication' | 'division'
  difficulty: 'easy' | 'medium' | 'hard'
  hint_used: boolean
  hint_text: string
  step_by_step_solution: string[] 
}

interface SubmissionResult {
  is_correct: boolean
  feedback_text: string
  explanation_hint: string
}

type Difficulty = 'easy' | 'medium' | 'hard'
type ProblemType = 'addition' | 'subtraction' | 'multiplication' | 'division'

export default function Home() {
  const router = useRouter();

  const { 
      score, setScore, 
      history, setHistory, 
      currentProblem, setCurrentProblem 
  } = useQuiz();

  const [hydrated, setHydrated] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [problemType, setProblemType] = useState<ProblemType>('addition')

  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hintText, setHintText] = useState('')
  const [hintSection, setHintSection] = useState('')
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // --- Generate Problem ---
  const generateProblem = useCallback(async () => {
    setIsLoading(true)
    setProblem(null)
    setUserAnswer('')
    setFeedback('')
    setHintText('')
    setIsCorrect(null)
    setHintSection('');

    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, problemType }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate problem.')
      }

      const data = await response.json() as MathProblem & { error?: string }
      if (data.error) {
        console.error(`Error: ${data.error}`)
      } else {
        setProblem({ ...data, hint_used: false })
        setHintText(data.hint_text);
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }, [difficulty, problemType])

  // --- Submit Answer ---
  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem || isLoading || isSubmitting || userAnswer === '') return

    setIsSubmitting(true)
    setIsCorrect(null)
    setHintSection('');

    try {
        const response = await fetch('/api/math-problem/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                session_id: problem.session_id,
                user_answer: parseFloat(userAnswer),
            }),
        })

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Failed to submit answer or internal server error.' }));
            throw new Error(errorData.error || 'Failed to submit answer.');
        }

        const result: SubmissionResult = await response.json();
        
        const formattedSteps = problem.step_by_step_solution
        .map((step) => `${step}`)
        .join('\n');

        setIsCorrect(result.is_correct)
        let fullFeedback = result.feedback_text;

        if (result.is_correct === false) {
          fullFeedback += `\n\n${'Solution'}: \n${formattedSteps}\n\n${'Correct Answer'}: ${problem.final_answer}`;
        }
        setFeedback(fullFeedback)

        // Update Score and History
        if (result.is_correct) {
            setScore(s => s + 1)
        }
        setHistory((prevHistory) => [
          ...prevHistory,
          {
            id: problem.session_id,
            problem: problem.problem_text,
            userAnswer: userAnswer,
            isCorrect: result.is_correct,
            type: problem.problem_type,
            difficulty: problem.difficulty,
            correctAnswer: problem.final_answer,
            step_by_step_solution:problem.step_by_step_solution
          },
        ])


    } catch (error) {
        console.error(error)
        setIsCorrect(false);
    } finally {
        setIsSubmitting(false)
    }
  }

  // --- Get Hint ---
  const getHint = () => { // Function is now synchronous (no 'await' needed)
    setProblem(p => p ? { ...p, hint_used: true } : null)
    setHintSection(`${hintText}\n\nNow, try solving the problem!`)
}

  const handleViewHistory = () => {
    router.push('/history');
  };

  // Tailwind classes for submission status box
  const statusClasses = useMemo(() => {
    if (isCorrect === null) {
        return 'border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600'
    } else if (isCorrect) {
        return 'border-green-600 bg-green-50 text-green-800 dark:bg-green-800/30 dark:text-green-200 dark:border-green-400'
    } else {
        return 'border-red-600 bg-red-50 text-red-800 dark:bg-red-800/30 dark:text-red-200 dark:border-red-400'
    }
  }, [isCorrect])

  const handleResetQuiz = () => {
    setScore(0);
    setHistory([]);
    setCurrentProblem(null);
    localStorage.removeItem('quizScore');
    localStorage.removeItem('quizHistory');
    setShowResetModal(false);
  };

  if (!hydrated) {
    // Return a placeholder (blank or loading) to avoid mismatch
    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900" />;
  }
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex justify-center p-4">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 space-y-8 border border-gray-100 dark:border-gray-700">

        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-indigo-700 dark:text-indigo-400 font-inter">
            Math Problem Generator 🧠
          </h1>

          <div className="text-xl font-semibold text-gray-600 dark:text-gray-300">
            Score: <span className="text-indigo-600 dark:text-indigo-400">{score}</span>
          </div>

          {/* Start Over Button */}
          <button
            onClick={() => setShowResetModal(true)}
            className="mt-3 px-5 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-md 
                      transition-all duration-300 transform hover:scale-[1.02] focus:outline-none focus:ring-4 
                      focus:ring-red-300 text-sm"
          >
            🔄 Start Over
          </button>
        </header>

        {/* --- Problem Settings and Generator --- */}
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-inner space-y-4" style={{ paddingTop: '10%' }}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Difficulty Select */}
            <div className="flex-1">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Difficulty
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                          focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            {/* Problem Type Select */}
            <div className="flex-1">
              <label htmlFor="problemType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Problem Type
              </label>
              <select
                id="problemType"
                value={problemType}
                onChange={(e) => setProblemType(e.target.value as ProblemType)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                          focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="addition">Addition</option>
                <option value="subtraction">Subtraction</option>
                <option value="multiplication">Multiplication</option>
                <option value="division">Division</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center" style={{ paddingTop: '10%' }}>
            <button
              onClick={generateProblem}
              disabled={isLoading || isSubmitting}
              className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 
                        transition-all duration-300 transform hover:scale-[1.02] focus:outline-none 
                        focus:ring-4 focus:ring-indigo-300 disabled:bg-gray-400 disabled:shadow-none 
                        disabled:transform-none disabled:cursor-not-allowed flex items-center min-w-[200px] justify-center"
            >
              {(isLoading || isSubmitting) && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                  5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 
                  7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading ? 'Generating...' : (isSubmitting ? 'Checking...' : 'Generate New Problem')}
            </button>
          </div>
        </div>

        {/* Problem Display Area */}
        {problem && (
          <div className="mt-6 p-6 bg-indigo-50 dark:bg-indigo-900 border-l-4 border-indigo-500 dark:border-indigo-400 rounded-xl shadow-md space-y-4 whitespace-pre-line">
            <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-200">The Problem:</h2>
            <p className="text-gray-800 dark:text-gray-100 text-xl leading-relaxed">{problem.problem_text}</p>
          </div>
        )}

        {/* Answer Form */}
        {problem && (
          <form onSubmit={submitAnswer} className="space-y-6 pt-4">
            <label htmlFor="answer" className="block text-lg font-medium text-gray-700 dark:text-gray-300">
              Your Answer (Number):
            </label>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full">
              <input
                id="answer"
                type="number"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Enter numerical answer"
                className="w-full sm:flex-grow px-5 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg 
                          focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm 
                          dark:bg-gray-700 dark:text-white"
                required
                disabled={isLoading || isSubmitting || isCorrect !== null}
              />

              <button
                type="submit"
                disabled={!userAnswer || isLoading || isSubmitting || isCorrect !== null}
                className={`w-full sm:w-auto px-8 py-3 font-bold rounded-lg shadow-lg transition-all duration-300 
                  ${
                    !userAnswer || isCorrect !== null
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400' 
                      : 'bg-green-600 text-white hover:bg-green-700 focus:ring-4 focus:ring-green-300'
                  }`}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>

            {/* Hint Button */}
            {isCorrect === null && problem && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={getHint}
                  disabled={isLoading || isSubmitting}
                  className="px-4 py-2 text-sm bg-yellow-500 text-white font-semibold rounded-md hover:bg-yellow-600 transition-colors disabled:bg-gray-400"
                >
                  Get Hint
                </button>
              </div>
            )}

            {isCorrect === null && !userAnswer && (
              <p className="text-sm text-red-500 dark:text-red-400 mt-1 text-center">Please enter an answer before submitting.</p>
            )}
          </form>
        )}

        {/* --- Feedback Area --- */}
        {(isCorrect !== null || feedback) && (
          <div className={`mt-4 p-5 border-2 rounded-xl transition-all duration-300 ${statusClasses}`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-xl pt-1">
                {isCorrect === true ? "✅" : isCorrect === false ? "❌" : "💡"}
              </div>
              <div>
                <p className="text-lg font-bold">
                  {isCorrect === true ? "Correct Answer!" : isCorrect === false ? "Incorrect Answer" : "Status Update"}
                </p>
                <p className="mt-1 text-base whitespace-pre-line leading-relaxed">{feedback}</p>
              </div>
            </div>
          </div>
        )}

        {/* --- Hint Area --- */}
        {(isCorrect === null && hintSection != '') && (
          <div className={`mt-4 p-5 border-2 rounded-xl transition-all duration-300 ${statusClasses}`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-xl pt-1">💡</div>
              <div>
                <p className="text-lg font-bold">Hint</p>
                <p className="mt-1 text-base whitespace-pre-line leading-relaxed">{hintSection}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6">
          <button 
            onClick={handleViewHistory}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 
                      font-medium transition-colors"
          >
            📜 View Full History
          </button>
        </div>
      </div>

      {/* --- Modal Confirmation --- */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Are you sure you want to restart?
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  handleResetQuiz();
                  setShowResetModal(false);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 
                          text-gray-800 dark:text-gray-200 rounded-md font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}