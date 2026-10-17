'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLanguage } from '../../lib/i18n'
import { useGrade } from '../../lib/useGrade'
import { Grade, OPTION_LETTERS, QuestionFormat, findTopic, topicsForGrade } from '../../lib/curriculum'
import { FormatPicker, GradePicker, topicLabel } from '../../components/Pickers'

type Difficulty = 'easy' | 'medium' | 'hard'

interface WorksheetProblem {
  problem_text: string
  final_answer?: number
  options?: string[]
  correct_option_index?: number
  step_by_step_solution: string[]
}

interface Worksheet {
  difficulty: Difficulty
  grade: Grade
  format: QuestionFormat
  topics: string[]
  problems: WorksheetProblem[]
}

export default function WorksheetPage() {
  const { t, language } = useLanguage()

  const [grade, setGrade] = useGrade()
  const gradeTopics = useMemo(() => topicsForGrade(grade), [grade])
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [topicIds, setTopicIds] = useState<string[]>(['addition'])
  const [format, setFormat] = useState<QuestionFormat>('numeric')
  const [count, setCount] = useState(10)
  const [showWorkingSpace, setShowWorkingSpace] = useState(true)
  const [includeAnswerKey, setIncludeAnswerKey] = useState(true)
  const [includeSolutions, setIncludeSolutions] = useState(true)

  const [worksheet, setWorksheet] = useState<Worksheet | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Drop topics the newly chosen grade doesn't teach
  useEffect(() => {
    setTopicIds(prev => prev.filter(id => gradeTopics.some(topic => topic.id === id)))
  }, [gradeTopics])

  const toggleTopic = (id: string) => {
    setTopicIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  const generateWorksheet = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/worksheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, grade, topics: topicIds, format, count, language }),
      })
      const data = await response.json()
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to generate worksheet.')
      }
      setWorksheet(data as Worksheet)
    } catch (e) {
      console.error(e)
      setError(t('worksheetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const worksheetTitle = worksheet
    ? t('worksheetHeading', {
        types: worksheet.topics.map(id => findTopic(id)).filter(Boolean).map(topic => topicLabel(topic!, language)).join(', ')
      })
    : ''

  const answerText = (p: WorksheetProblem) =>
    worksheet?.format === 'mcq' && p.options && p.correct_option_index !== undefined
      ? `${OPTION_LETTERS[p.correct_option_index]}. ${p.options[p.correct_option_index]}`
      : (p.final_answer ?? 0).toLocaleString('en-MY')

  return (
    <div className="space-y-6 print:space-y-0">

      {/* --- Settings (hidden when printing) --- */}
      <div className="print:hidden space-y-6">
        <div>
          <h1 className="page-title">{t('worksheetTitle')}</h1>
          <p className="page-subtitle">{t('worksheetSubtitle')}</p>
        </div>

        <div className="card p-5 md:p-6 space-y-5">
          <GradePicker value={grade} onChange={setGrade} />

          <fieldset>
            <legend className="field-label">{t('chooseTopics')}</legend>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {gradeTopics.map(topic => {
                const checked = topicIds.includes(topic.id)
                return (
                  <label
                    key={topic.id}
                    className={`flex items-center justify-center gap-1 px-3 py-2 rounded-xl border text-sm font-semibold cursor-pointer text-center transition-colors
                      has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500
                      ${checked ? 'border-teal-600 bg-teal-50 text-teal-800' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300'}`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTopic(topic.id)}
                      className="sr-only"
                    />
                    {checked ? '✓ ' : ''}{topicLabel(topic, language)}
                  </label>
                )
              })}
            </div>
          </fieldset>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="difficulty" className="field-label">
                {t('chooseDifficulty')}
              </label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className="field"
              >
                <option value="easy">{t('easy')}</option>
                <option value="medium">{t('medium')}</option>
                <option value="hard">{t('hard')}</option>
              </select>
            </div>
            <FormatPicker value={format} onChange={setFormat} />
          </div>

          <div>
            <label htmlFor="count" className="field-label">
              {t('numberOfProblems')}: {count}
            </label>
            <input
              id="count"
              type="range"
              min={5}
              max={20}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full accent-teal-600"
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-x-6 gap-y-2 text-sm text-slate-700 font-medium">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showWorkingSpace} onChange={(e) => setShowWorkingSpace(e.target.checked)} className="w-4 h-4 accent-teal-600" />
              {t('workingSpace')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={includeAnswerKey} onChange={(e) => setIncludeAnswerKey(e.target.checked)} className="w-4 h-4 accent-teal-600" />
              {t('answerKey')}
            </label>
            <label className={`flex items-center gap-2 ${includeAnswerKey ? '' : 'opacity-50'}`}>
              <input type="checkbox" checked={includeSolutions} disabled={!includeAnswerKey} onChange={(e) => setIncludeSolutions(e.target.checked)} className="w-4 h-4 accent-teal-600" />
              {t('showWorkingInKey')}
            </label>
          </div>

          <button
            onClick={generateWorksheet}
            disabled={isLoading || topicIds.length === 0}
            className="btn-primary w-full py-3 text-base"
          >
            {isLoading
              ? t('generatingProblems', { n: count })
              : topicIds.length === 0
                ? t('pickOneType')
                : worksheet ? t('generateNewWorksheet') : t('generateWorksheet')}
          </button>

          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
        </div>

        {worksheet && (
          <div className="space-y-2">
            <button
              onClick={() => window.print()}
              className="btn-accent w-full py-3 text-base"
            >
              {t('downloadPdf')}
            </button>
            <p className="text-sm text-gray-600 text-center">{t('saveAsPdfTip')}</p>
          </div>
        )}
      </div>

      {/* --- Printable worksheet --- */}
      {worksheet && (
        <div className="card text-gray-900 p-6 md:p-12 print:border-0 print:shadow-none print:rounded-none print:p-0">
          <section>
            <div className="flex justify-between items-end gap-4 border-b-2 border-gray-800 pb-3">
              <div>
                <h2 className="text-xl font-extrabold">{worksheetTitle}</h2>
                <p className="text-sm text-gray-600">
                  {t('worksheetMeta', { grade: worksheet.grade, difficulty: t(worksheet.difficulty), n: worksheet.problems.length })}
                </p>
              </div>
              <p className="text-sm font-semibold whitespace-nowrap">{t('score')}: ____ / {worksheet.problems.length}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 mt-4 text-sm font-semibold">
              <p>{t('name')}: ______________________________</p>
              <p>{t('date')}: ____________________</p>
            </div>

            <ol className="mt-6 space-y-6">
              {worksheet.problems.map((p, i) => (
                <li key={i} className="break-inside-avoid">
                  <div className="flex gap-3">
                    <span className="font-bold">{i + 1}.</span>
                    <p className="leading-relaxed">{p.problem_text}</p>
                  </div>
                  {worksheet.format === 'mcq' && p.options ? (
                    <ul className="ml-7 mt-2 grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1">
                      {p.options.map((option, j) => (
                        <li key={j}><span className="font-semibold">{OPTION_LETTERS[j]}.</span> {option}</li>
                      ))}
                    </ul>
                  ) : (
                    <>
                      {showWorkingSpace && (
                        <div className="ml-7 mt-2 h-28 border border-dashed border-gray-300 rounded-lg" aria-hidden="true" />
                      )}
                      <p className="ml-7 mt-2 text-right font-semibold">{t('answer')}: ________________</p>
                    </>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {includeAnswerKey && (
            <section className="mt-12 pt-8 border-t-4 border-double border-gray-400 print:mt-0 print:pt-0 print:border-0 break-before-page">
              <h2 className="text-xl font-extrabold border-b-2 border-gray-800 pb-3">{t('answerKey')}</h2>
              <p className="text-sm text-gray-600 mt-1">{worksheetTitle} · {t('gradeN', { n: worksheet.grade })} · {t(worksheet.difficulty)}</p>
              <ol className="mt-6 space-y-4">
                {worksheet.problems.map((p, i) => (
                  <li key={i} className="break-inside-avoid">
                    <p><span className="font-bold">{i + 1}.</span> <span className="font-bold text-green-700">{answerText(p)}</span></p>
                    {includeSolutions && (
                      <ul className="ml-6 mt-1 text-sm text-gray-700 space-y-0.5">
                        {p.step_by_step_solution.map((step, j) => <li key={j}>{step}</li>)}
                      </ul>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
