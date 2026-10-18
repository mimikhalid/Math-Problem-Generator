'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuiz } from '../../lib/QuizContext';
import { useLanguage } from '../../lib/i18n';
import { useGrade } from '../../lib/useGrade';
import { OPTION_LETTERS, QuestionFormat, findTopic, topicsForGrade } from '../../lib/curriculum';
import { FormatPicker, GradePicker, Segmented, topicLabel } from '../../components/Pickers';
import Icon from '../../components/Icon';

type Difficulty = 'easy' | 'medium' | 'hard'

interface MathProblem {
  session_id: string
  problem_text: string
  format: QuestionFormat
  options: string[] | null
  final_answer: number
  answer_label: string
  hint_text: string
  step_by_step_solution: string[]
  topic: string
  difficulty: Difficulty
}

interface AnswerRecord {
  userAnswer: string
  label: string
  isCorrect: boolean
}

type Stage = 'setup' | 'loading' | 'quiz' | 'summary'

const SET_SIZES = [5, 10, 15]

/** Numeric answers match if equal to within rounding noise (e.g. 0.1 + 0.2). */
const sameNumber = (a: number, b: number) => Math.abs(a - b) < 1e-9

export default function Home() {
  const { t, language } = useLanguage();
  const { setScore, setHistory } = useQuiz();

  const [hydrated, setHydrated] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const answerRef = useRef<HTMLInputElement>(null);

  // Settings
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [grade, setGrade] = useGrade()
  const gradeTopics = useMemo(() => topicsForGrade(grade), [grade])
  const [topicId, setTopicId] = useState('addition')
  const [format, setFormat] = useState<QuestionFormat>('numeric')
  const [setSize, setSetSize] = useState(10)

  // Set progress
  const [stage, setStage] = useState<Stage>('setup')
  const [problems, setProblems] = useState<MathProblem[]>([])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<(AnswerRecord | null)[]>([])
  const [userAnswer, setUserAnswer] = useState('')
  const [showHint, setShowHint] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => setHydrated(true), []);

  // Keep the chosen topic valid when switching to a grade that doesn't teach it
  useEffect(() => {
    if (!gradeTopics.some(topic => topic.id === topicId)) setTopicId(gradeTopics[0].id)
  }, [gradeTopics, topicId])

  const problem = problems[index]
  const answer = answers[index] ?? null
  const correctCount = answers.filter(a => a?.isCorrect).length

  // Keep the current question in view and the cursor in the answer box
  useEffect(() => {
    if (stage !== 'quiz') return
    cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    answerRef.current?.focus({ preventScroll: true })
  }, [stage, index])

  // --- Generate a set ---
  const startSet = async () => {
    setStage('loading')
    setError('')
    try {
      const response = await fetch('/api/math-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, grade, topic: topicId, format, language, count: setSize }),
      })
      const data = await response.json()
      if (!response.ok || data.error || !Array.isArray(data.problems) || data.problems.length === 0) {
        throw new Error(data.error || 'Failed to generate problems.')
      }
      beginQuiz(data.problems)
    } catch (e) {
      console.error(e)
      setError(t('generateFailed'))
      setStage('setup')
    }
  }

  const beginQuiz = (set: MathProblem[]) => {
    setProblems(set)
    setAnswers(set.map(() => null))
    setIndex(0)
    setUserAnswer('')
    setShowHint(false)
    setStage('quiz')
  }

  // --- Check an answer (instantly, on this device) ---
  const checkAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!problem || answer || userAnswer === '') return

    const value = parseFloat(userAnswer)
    const isCorrect = sameNumber(value, problem.final_answer)
    const label = problem.format === 'mcq' && problem.options
      ? `${OPTION_LETTERS[value]}. ${problem.options[value]}`
      : userAnswer

    setAnswers(prev => prev.map((a, i) => i === index ? { userAnswer, label, isCorrect } : a))
    setShowHint(false)
    if (isCorrect) setScore(s => s + 1)
    setHistory(prev => [
      ...prev,
      {
        id: `${problem.session_id}-${Date.now()}`,
        problem: problem.problem_text,
        userAnswer: label,
        isCorrect,
        type: problem.topic,
        difficulty: problem.difficulty,
        correctAnswer: problem.answer_label,
        step_by_step_solution: problem.step_by_step_solution,
      },
    ])

    // Record the submission in the background; the student doesn't wait for it
    fetch('/api/math-problem/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: problem.session_id, user_answer: value, language, format: problem.format, ai_feedback: false }),
    }).catch(err => console.error('Failed to save submission', err))
  }

  const goNext = () => {
    if (index + 1 >= problems.length) {
      setStage('summary')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    setIndex(i => i + 1)
    setUserAnswer('')
    setShowHint(false)
  }

  const currentTopic = findTopic(topicId)

  if (!hydrated) {
    return <div className="min-h-[50vh]" />;
  }

  const summaryMessage = problems.length === 0
    ? ''
    : correctCount / problems.length >= 0.8 ? t('summaryGreat')
      : correctCount / problems.length >= 0.5 ? t('summaryGood')
        : t('summaryKeepGoing')

  return (
    <div className="space-y-6">

      {/* --- Page heading --- */}
      <div>
        <h1 className="page-title">{t('practiceTitle')}</h1>
        <p className="page-subtitle">{t('practiceSubtitle')}</p>
      </div>

      {/* --- Settings or summary bar --- */}
      {stage === 'setup' ? (
        <div className="card p-5 md:p-6 space-y-5">
          <GradePicker value={grade} onChange={setGrade} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="topic" className="field-label">{t('chooseTopic')}</label>
              <select id="topic" value={topicId} onChange={(e) => setTopicId(e.target.value)} className="field">
                {gradeTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topicLabel(topic, language)}</option>
                ))}
              </select>
            </div>
            <Segmented<Difficulty>
              label={t('chooseDifficulty')}
              value={difficulty}
              onChange={setDifficulty}
              columns={3}
              options={[
                { value: 'easy', label: t('easy') },
                { value: 'medium', label: t('medium') },
                { value: 'hard', label: t('hard') },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormatPicker value={format} onChange={setFormat} />
            <Segmented<number>
              label={t('numberOfQuestions')}
              value={setSize}
              onChange={setSetSize}
              columns={3}
              options={SET_SIZES.map(n => ({ value: n, label: String(n) }))}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>
          )}

          <button onClick={startSet} className="btn-primary w-full py-3 text-base">
            {t('startSet')}
          </button>
        </div>
      ) : (
        <div className="card px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip bg-teal-50 text-teal-700">{t('gradeN', { n: grade })}</span>
            {currentTopic && <span className="chip">{topicLabel(currentTopic, language)}</span>}
            <span className="chip">{t(difficulty)}</span>
            <span className="chip">{format === 'mcq' ? t('formatMcq') : t('formatNumeric')}</span>
          </div>
          {stage !== 'loading' && (
            <button onClick={() => setStage('setup')} className="btn-ghost py-1.5 text-teal-700">
              <Icon name="sliders" size={16} /> {t('changeSettings')}
            </button>
          )}
        </div>
      )}

      {/* --- Empty state --- */}
      {stage === 'setup' && !error && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700"><Icon name="book" size={22} /></span>
          <p className="mt-2 font-semibold text-slate-800">{t('practiceEmptyTitle')}</p>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">{t('practiceEmptyBody')}</p>
        </div>
      )}

      {/* --- Loading --- */}
      {stage === 'loading' && (
        <div className="card p-6 md:p-8 space-y-4 text-center" aria-busy="true" aria-live="polite">
          <span className="mx-auto block w-8 h-8 rounded-full border-[3px] border-teal-600 border-t-transparent animate-spin" aria-hidden="true" />
          <p className="font-semibold text-slate-800">{t('preparingSet', { n: setSize })}</p>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">{t('preparingSetNote')}</p>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-sm mx-auto">
            <div className="h-full w-1/2 bg-teal-500 rounded-full animate-pulse" />
          </div>
        </div>
      )}

      {/* --- Question --- */}
      {stage === 'quiz' && problem && (
        <div ref={cardRef} className="card p-5 md:p-7 space-y-6 scroll-mt-20">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-teal-700">{t('questionNofM', { n: index + 1, total: problems.length })}</span>
              <span className="text-slate-500">{t('scoreOutOf', { correct: correctCount, total: problems.length })}</span>
            </div>
            <div className="flex gap-1" aria-hidden="true">
              {problems.map((_, i) => {
                const a = answers[i]
                const color = a ? (a.isCorrect ? 'bg-green-500' : 'bg-red-400') : i === index ? 'bg-teal-500' : 'bg-slate-200'
                return <div key={i} className={`h-1.5 flex-1 rounded-full ${color}`} />
              })}
            </div>
          </div>

          <p className="text-lg leading-relaxed text-slate-900">{problem.problem_text}</p>

          {showHint && !answer && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <Icon name="lightbulb" size={16} className="inline -mt-0.5 mr-1.5 text-amber-600" /><span className="font-semibold">{t('hint')}: </span>{problem.hint_text}
            </div>
          )}

          <form onSubmit={checkAnswer} className="space-y-4">
            {problem.format === 'mcq' && problem.options ? (
              <fieldset>
                <legend className="field-label">{t('chooseOption')}</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {problem.options.map((option, i) => {
                    const selected = (answer?.userAnswer ?? userAnswer) === String(i)
                    const isRight = i === problem.final_answer
                    const stateClass = answer
                      ? isRight
                        ? 'border-green-500 bg-green-50 text-green-900'
                        : selected ? 'border-red-400 bg-red-50 text-red-900' : 'border-slate-200 text-slate-400'
                      : selected
                        ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                        : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50 text-slate-800'
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setUserAnswer(String(i))}
                        disabled={!!answer}
                        aria-pressed={selected}
                        className={`flex items-center gap-3 text-left px-4 py-3 border-2 rounded-xl transition-colors ${stateClass}`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${selected || (answer && isRight) ? 'bg-white' : 'bg-slate-100'}`}>
                          {OPTION_LETTERS[i]}
                        </span>
                        <span className="font-medium">{option}</span>
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ) : (
              <div>
                <label htmlFor="answer" className="field-label">{t('yourAnswer')}</label>
                <input
                  ref={answerRef}
                  id="answer"
                  type="number"
                  step="any"
                  inputMode="decimal"
                  value={answer?.userAnswer ?? userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder={t('enterAnswer')}
                  className="field py-3 text-base"
                  disabled={!!answer}
                  autoComplete="off"
                />
              </div>
            )}

            {!answer && (
              <div className="flex flex-col-reverse sm:flex-row gap-3">
                <button type="button" onClick={() => setShowHint(h => !h)} className="btn-secondary">
                  <Icon name="lightbulb" size={16} /> {t('getHint')}
                </button>
                <button
                  type="submit"
                  disabled={userAnswer === ''}
                  title={userAnswer === '' ? t('pleaseEnterAnswer') : undefined}
                  className="btn-primary flex-1 py-3"
                >
                  {t('checkAnswer')}
                </button>
              </div>
            )}
          </form>

          {/* Result */}
          {answer && (
            <div aria-live="polite" className={`rounded-xl border px-4 py-4 space-y-3 ${answer.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <div className="flex items-start gap-3">
                <Icon name={answer.isCorrect ? 'checkCircle' : 'xCircle'} size={24} className={answer.isCorrect ? 'text-green-600' : 'text-red-500'} />
                <div className="space-y-1">
                  <p className={`font-bold ${answer.isCorrect ? 'text-green-800' : 'text-red-800'}`}>
                    {answer.isCorrect ? t('correctAnswerTitle') : t('incorrectAnswerTitle')}
                  </p>
                  <p className="text-sm text-slate-700">{answer.isCorrect ? t('praiseCorrect') : t('encourageIncorrect')}</p>
                  {!answer.isCorrect && (
                    <p className="text-sm text-slate-700">
                      {t('correctAnswer')}: <span className="font-bold text-green-700">{problem.answer_label}</span>
                    </p>
                  )}
                </div>
              </div>
              <details className="rounded-lg bg-white/70 px-3 py-2" open={!answer.isCorrect}>
                <summary className="cursor-pointer text-sm font-semibold text-slate-700 select-none">{t('showWorking')}</summary>
                <ol className="mt-2 space-y-1 text-sm text-slate-700">
                  {problem.step_by_step_solution.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </details>
            </div>
          )}

          {answer && (
            <button onClick={goNext} autoFocus className="btn-accent w-full py-3">
              {index + 1 >= problems.length ? t('seeResults') : t('nextQuestion')} <Icon name="arrowRight" size={16} />
            </button>
          )}
        </div>
      )}

      {/* --- Summary --- */}
      {stage === 'summary' && (
        <div className="space-y-4">
          <div className="card p-6 md:p-8 text-center space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">{t('setComplete')}</p>
            <p className="text-5xl font-bold tracking-tight text-slate-900">
              {correctCount}<span className="text-slate-400">/{problems.length}</span>
            </p>
            <p className="text-slate-600 max-w-md mx-auto">{summaryMessage}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button onClick={() => beginQuiz(problems)} className="btn-secondary"><Icon name="rotate" size={16} /> {t('retrySet')}</button>
              <button onClick={startSet} className="btn-primary"><Icon name="plus" size={16} /> {t('newSet')}</button>
            </div>
          </div>

          <div className="card divide-y divide-slate-100">
            <p className="px-5 py-3 text-sm font-semibold text-slate-700">{t('reviewAnswers')}</p>
            {problems.map((p, i) => {
              const a = answers[i]
              return (
                <details key={p.session_id} className="group px-5 py-3">
                  <summary className="flex cursor-pointer items-start gap-3 list-none">
                    <Icon name={a?.isCorrect ? 'checkCircle' : 'xCircle'} size={18} className={`mt-0.5 ${a?.isCorrect ? 'text-green-600' : 'text-red-500'}`} />
                    <span className="flex-1 text-sm text-slate-800 line-clamp-2 group-open:line-clamp-none">{i + 1}. {p.problem_text}</span>
                  </summary>
                  <div className="mt-2 ml-8 space-y-1 text-sm text-slate-600">
                    <p>{t('yourAnswerWas')}: <span className={a?.isCorrect ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>{a?.label ?? '-'}</span></p>
                    {!a?.isCorrect && <p>{t('correctAnswer')}: <span className="font-semibold text-green-700">{p.answer_label}</span></p>}
                    <ol className="pt-1 space-y-0.5">
                      {p.step_by_step_solution.map((step, j) => <li key={j}>{step}</li>)}
                    </ol>
                  </div>
                </details>
              )
            })}
          </div>
        </div>
      )}
    </div>
  );
}
