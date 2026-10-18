'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '../../lib/i18n'
import { useGrade } from '../../lib/useGrade'
import { Grade } from '../../lib/curriculum'
import { GradePicker, Segmented } from '../../components/Pickers'
import Icon from '../../components/Icon'
import { useQuiz } from '../../lib/QuizContext'

interface Sum {
  text: string
  answer: number
}

const DURATIONS = [60, 120, 180]

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = <T,>(items: T[]) => items[rand(0, items.length - 1)]

const add = (max: number): Sum => { const a = rand(1, max - 1), b = rand(1, max - a); return { text: `${a} + ${b}`, answer: a + b } }
const sub = (max: number): Sum => { const a = rand(2, max), b = rand(1, a - 1); return { text: `${a} − ${b}`, answer: a - b } }
const mul = (aMin: number, aMax: number, bMin: number, bMax: number): Sum => { const a = rand(aMin, aMax), b = rand(bMin, bMax); return { text: `${a} × ${b}`, answer: a * b } }
// Built from the answer so division is always exact
const div = (qMin: number, qMax: number, dMin: number, dMax: number): Sum => { const q = rand(qMin, qMax), d = rand(dMin, dMax); return { text: `${q * d} ÷ ${d}`, answer: q } }

/** Quick mental sums sized to what each Tahun has learnt. */
function makeSum(grade: Grade): Sum {
  switch (grade) {
    case 1: return pick([() => add(20), () => sub(20)])()
    case 2: return pick([() => add(100), () => sub(100), () => mul(1, 10, 2, 5)])()
    case 3: return pick([() => add(1000), () => sub(1000), () => mul(2, 10, 2, 10), () => div(2, 10, 2, 10)])()
    case 4: return pick([() => add(10000), () => sub(10000), () => mul(11, 99, 2, 9), () => div(11, 99, 2, 9)])()
    case 5: return pick([() => add(100000), () => sub(100000), () => mul(101, 999, 2, 9), () => div(101, 999, 2, 9)])()
    case 6: return pick([() => add(1000000), () => sub(1000000), () => mul(11, 99, 11, 99), () => div(101, 999, 11, 25)])()
  }
}

const bestKey = (grade: Grade, secs: number) => `drillBest:${grade}:${secs}`

export default function DrillPage() {
  const { t } = useLanguage()
  const [grade, setGrade] = useGrade()
  const { setDrillHistory } = useQuiz()
  const [duration, setDuration] = useState(60)

  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [timeLeft, setTimeLeft] = useState(60)
  const [sum, setSum] = useState<Sum | null>(null)
  const [answer, setAnswer] = useState('')
  const [correct, setCorrect] = useState(0)
  const [attempted, setAttempted] = useState(0)
  const [streak, setStreak] = useState(0)
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null)
  const [best, setBest] = useState(0)
  const [isNewBest, setIsNewBest] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    try { setBest(Number(localStorage.getItem(bestKey(grade, duration))) || 0) } catch { setBest(0) }
  }, [grade, duration])

  const start = () => {
    setRunning(true)
    setFinished(false)
    setTimeLeft(duration)
    setCorrect(0)
    setAttempted(0)
    setStreak(0)
    setFlash(null)
    setIsNewBest(false)
    setAnswer('')
    setSum(makeSum(grade))
  }

  const finish = useCallback(() => {
    setRunning(false)
    setFinished(true)
  }, [])

  // Countdown
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(id)
  }, [running])

  useEffect(() => {
    if (running && timeLeft <= 0) finish()
  }, [running, timeLeft, finish])

  // Save best score and log the round when it ends
  useEffect(() => {
    if (!finished) return
    if (attempted > 0) {
      setDrillHistory(prev => [
        ...prev,
        { id: String(Date.now()), date: new Date().toISOString(), grade, seconds: duration, correct, attempted },
      ])
    }
    if (correct > best) {
      setBest(correct)
      setIsNewBest(true)
      try { localStorage.setItem(bestKey(grade, duration), String(correct)) } catch { /* ignore */ }
    }
    // only when the round finishes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  useEffect(() => {
    if (running) inputRef.current?.focus()
  }, [running, sum])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!sum || answer.trim() === '') return
    const ok = Number(answer) === sum.answer
    setAttempted(a => a + 1)
    if (ok) {
      setCorrect(c => c + 1)
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
    setFlash({ ok, text: `${sum.text} = ${sum.answer.toLocaleString('en-MY')}` })
    setAnswer('')
    setSum(makeSum(grade))
  }

  const skip = () => {
    if (!sum) return
    setAttempted(a => a + 1)
    setStreak(0)
    setFlash({ ok: false, text: `${sum.text} = ${sum.answer.toLocaleString('en-MY')}` })
    setAnswer('')
    setSum(makeSum(grade))
  }

  const minutes = Math.floor(Math.max(timeLeft, 0) / 60)
  const seconds = String(Math.max(timeLeft, 0) % 60).padStart(2, '0')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">{t('drillTitle')}</h1>
        <p className="page-subtitle">{t('drillSubtitle')}</p>
      </div>

      {!running && (
        <div className="card p-5 md:p-6 space-y-5">
          <GradePicker value={grade} onChange={setGrade} />

          <Segmented<number>
            label={t('duration')}
            value={duration}
            onChange={setDuration}
            columns={3}
            options={DURATIONS.map(secs => ({ value: secs, label: t('seconds', { n: secs }) }))}
          />

          <p className="flex items-center gap-2 text-sm text-slate-500"><Icon name="trophy" size={16} className="text-amber-500" /> {t('bestScore', { grade, secs: duration, best })}</p>

          <button
            onClick={start}
            className="btn-primary w-full py-3 text-base"
          >
            {finished ? t('playAgain') : t('startDrill')}
          </button>
        </div>
      )}

      {finished && !running && (
        <div className="card p-6 text-center space-y-2">
          <p className="text-xl font-bold text-slate-900">{t('timesUp')}</p>
          <p className="text-slate-700">{t('drillResult', { correct, total: attempted })}</p>
          {isNewBest && <p className="font-bold text-amber-600">{t('newBest')}</p>}
        </div>
      )}

      {running && sum && (
        <div className="card p-5 md:p-7 space-y-6">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-slate-500">{t('timeLeft')}</p>
              <p className={`text-xl font-extrabold tabular-nums ${timeLeft <= 10 ? 'text-red-600' : 'text-slate-900'}`}>{minutes}:{seconds}</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-slate-500"><Icon name="check" size={14} /> {t('statSolved')}</p>
              <p className="text-xl font-extrabold text-green-600 tabular-nums">{correct}</p>
            </div>
            <div>
              <p className="flex items-center justify-center gap-1 text-xs text-slate-500"><Icon name="flame" size={14} /> {t('streak')}</p>
              <p className="text-xl font-extrabold text-amber-600 tabular-nums">{streak}</p>
            </div>
          </div>

          <div className="h-2 bg-slate-100 rounded-full overflow-hidden" aria-hidden="true">
            <div className="h-full bg-teal-500 transition-all duration-1000 ease-linear" style={{ width: `${(Math.max(timeLeft, 0) / duration) * 100}%` }} />
          </div>

          <p className="py-4 text-4xl md:text-6xl font-bold text-center text-slate-900 tabular-nums tracking-tight">{sum.text} = ?</p>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3">
            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              aria-label={t('answer')}
              className="field flex-1 py-3 text-xl text-center"
              autoComplete="off"
            />
            <div className="grid grid-cols-2 sm:flex gap-3">
              <button type="submit" className="btn-primary py-3">
                {t('submit')}
              </button>
              <button type="button" onClick={skip} className="btn-secondary py-3">
                {t('skip')}
              </button>
            </div>
          </form>

          <div className="min-h-[1.5rem] text-center text-sm" aria-live="polite">
            {flash && (
              <span className={flash.ok ? 'text-green-700' : 'text-red-700'}>
                <Icon name={flash.ok ? 'checkCircle' : 'xCircle'} size={16} className="inline -mt-0.5 mr-1" />{flash.text}
              </span>
            )}
          </div>

          <button onClick={finish} className="btn-ghost mx-auto flex text-slate-500">
            {t('stop')}
          </button>
        </div>
      )}
    </div>
  )
}
