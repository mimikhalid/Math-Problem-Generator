'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
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
  const problemRef = useRef<HTMLDivElement>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [problemType, setProblemType] = useState<ProblemType>('addition')

  const [problem, setProblem] = useState<MathProblem | null>(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerateProblem, setGenerateProblem] = useState(false)
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hintText, setHintText] = useState('')
  const [hintSection, setHintSection] = useState('')
  const [showResetModal, setShowResetModal] = useState(false);

  useEffect(() => {
    setHydrated(true);

    if (problem && problemRef.current) {
      problemRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [problem]);

  // --- Generate Problem ---
  const generateProblem = useCallback(async () => {
    setIsLoading(true)
    setGenerateProblem(true)
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
        setGenerateProblem(false)
        // Scroll to problem card
        problemRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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

  const isDisabledState = !userAnswer || isLoading || isSubmitting || isCorrect !== null;
  
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
    <div className="w-full max-w-4xl space-y-8">

      {/* --- Header --- */}
      <header className="relative text-center bg-blue-400 dark:bg-blue-600 text-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto w-full">
        <h1 className="text-3xl md:text-5xl font-extrabold font-inter flex items-center justify-center gap-3">
          Math Problem Generator
        </h1>
        <p className="mt-6 text-lg md:text-xl text-blue-100 dark:text-blue-200">
          Challenge your Primary 5 math skills with AI-generated problems tailored to your learning pace.
        </p>

        {/* Score Badge */}
        <div className="mt-4 text-xl md:text-2xl font-semibold flex justify-center items-center gap-2">
          <span className="px-3 py-1 bg-yellow-300 text-indigo-800 font-bold rounded-full shadow-md text-lg">
            🎯 {score} Points
          </span>
        </div>

        {/* Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row justify-center items-center gap-4">
          <button
            onClick={() => setShowResetModal(true)}
            className="px-6 py-3 bg-pink-400 hover:bg-pink-500 text-white font-bold rounded-xl shadow-md 
                       transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pink-300 text-sm"
          >
            Start Over
          </button>

          <button
            onClick={handleViewHistory}
            className="px-6 py-3 bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl shadow-md 
                       transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 text-sm"
          >
            History
          </button>
        </div>
      </header>

      <div className="bg-blue-200 rounded-2xl p-6 shadow-md space-y-6">
        {/* Difficulty */}
        <div>
          <label htmlFor="difficulty" className="block text-lg font-bold text-blue-800 mb-2">
            Choose Difficulty
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-5 py-3 rounded-xl shadow-md bg-white text-blue-800 font-semibold text-lg 
                      focus:ring-2 focus:ring-blue-400"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>

        {/* Problem Type */}
        <div>
          <label htmlFor="problemType" className="block text-lg font-bold text-blue-800 mb-2">
            Choose Problem Type
          </label>
          <select
            id="problemType"
            value={problemType}
            onChange={(e) => setProblemType(e.target.value as ProblemType)}
            className="w-full px-5 py-3 rounded-xl shadow-md bg-white text-blue-800 font-semibold text-lg 
                      focus:ring-2 focus:ring-blue-400"
          >
            <option value="addition">Addition</option>
            <option value="subtraction">Subtraction</option>
            <option value="multiplication">Multiplication</option>
            <option value="division">Division</option>
          </select>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center">
          <button
            onClick={generateProblem}
            disabled={isGenerateProblem}
            className="w-full px-6 py-3 bg-green-400 hover:bg-green-500 text-white font-bold rounded-xl shadow-md
                      transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg"
          >
            {isGenerateProblem ? 'Generating...' : 'Challenge Yourself!'}
          </button>
        </div>
      </div>

      {/* --- Card 2: Problem Display & Answer Form --- */}
      {problem && (
        <div ref={problemRef} className="bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">

           {/* Problem Display */}
            <div className="p-6 bg-white rounded-xl shadow-md space-y-4 text-xl leading-relaxed">
              <h2 className="font-bold text-indigo-700 text-2xl">📝 The Problem:</h2>
              <p className="text-indigo-900">{problem.problem_text}</p>
            </div>

          {/* Answer Form */}
          <form onSubmit={submitAnswer} className="space-y-4">
            <label
              htmlFor="answer"
              className="block text-lg font-bold text-indigo-700"
            >
              Your Answer:
            </label>

            <input
              id="answer"
              type="number"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Enter your answer"
              className="w-full px-5 py-3 border-2 border-indigo-300 rounded-xl text-lg focus:ring-2 focus:ring-indigo-400 shadow-sm"
              required
              disabled={isLoading || isSubmitting || isCorrect !== null}
            />

            {/* Buttons */}
            <div className="flex flex-col gap-3 w-full">
              <div
                className="relative w-full group"
                onClick={(e) => {
                  if (isDisabledState) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              >
                {/* Tooltip hanya muncul bila hover button Submit */}
                {isDisabledState && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 
                                  mb-2 px-3 py-1 text-xs text-white bg-gray-700 rounded-lg 
                                  opacity-0 group-hover:opacity-100 transition duration-300 whitespace-nowrap 
                                  pointer-events-none z-10">
                    Please enter your answer.
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className={`w-full px-6 py-3 font-bold rounded-xl shadow-lg text-white text-lg
                  ${isDisabledState
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-400 to-green-600 hover:scale-105 transition-transform"}
                  `}
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              </div>

              {/* Get Hint Button */}
              {isCorrect === null && problem && (
                <button
                  type="button"
                  onClick={getHint}
                  disabled={isLoading || isSubmitting}
                  className="w-full px-6 py-3 text-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-white font-bold rounded-xl hover:scale-105 transition-transform"
                  >
                  Get Hint
                </button>
              )}
            </div>
          </form>

          {/* Feedback Area */}
          {(isCorrect !== null || feedback) && (
            <div className={`mt-4 p-4 rounded-xl shadow-md ${statusClasses}`}>
              <div className="flex items-start gap-3">
                <div className="text-2xl pt-1">
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

          {/* Hint Area */}
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

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-6 right-6 bg-indigo-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-600 transition-all"
          >
            ↑ Back to Top
          </button>

        </div>
      )}


      {/* --- Modal Confirmation --- */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Are you sure you want to start over? <br />
              This will clear your full history and total score.
            </h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => {
                  handleResetQuiz();
                  setShowResetModal(false);
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-semibold"
              >
                Yes
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
    </div>
  );

}