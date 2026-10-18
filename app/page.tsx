'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLanguage, TranslationKey } from '../lib/i18n'
import { useQuiz } from '../lib/QuizContext'
import Icon, { IconName } from '../components/Icon'

const MODES: { href: string; icon: IconName; title: TranslationKey; desc: TranslationKey; tint: string }[] = [
  { href: '/practice', icon: 'pencil', title: 'navPractice', desc: 'modePracticeDesc', tint: 'bg-teal-50 text-teal-700' },
  { href: '/drill', icon: 'zap', title: 'navDrill', desc: 'modeDrillDesc', tint: 'bg-amber-50 text-amber-700' },
  { href: '/worksheet', icon: 'printer', title: 'navWorksheet', desc: 'modeWorksheetDesc', tint: 'bg-sky-50 text-sky-700' },
]

const STEPS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'step1Title', body: 'step1Body' },
  { title: 'step2Title', body: 'step2Body' },
  { title: 'step3Title', body: 'step3Body' },
]

const SAMPLE_OPTIONS = ['RM8', 'RM10', 'RM12', 'RM14']
const SAMPLE_CORRECT = 1

/** A static copy of a practice question, so visitors see what the app looks like. */
function QuestionPreview() {
  const { t } = useLanguage()
  return (
    <div className="card w-full p-5 shadow-md space-y-4 rotate-[0.6deg]">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-teal-700">{t('questionNofM', { n: 3, total: 10 })}</span>
          <span className="text-slate-400">{t('scoreOutOf', { correct: 2, total: 10 })}</span>
        </div>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i < 2 ? 'bg-green-500' : i === 2 ? 'bg-teal-500' : 'bg-slate-200'}`} />
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-slate-800">{t('sampleQuestion')}</p>
      <div className="grid grid-cols-2 gap-2">
        {SAMPLE_OPTIONS.map((option, i) => (
          <div
            key={option}
            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-medium
              ${i === SAMPLE_CORRECT ? 'border-green-500 bg-green-50 text-green-900' : 'border-slate-200 text-slate-500'}`}
          >
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${i === SAMPLE_CORRECT ? 'bg-white' : 'bg-slate-100'}`}>
              {'ABCD'[i]}
            </span>
            {option}
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-900">
        <Icon name="checkCircle" size={16} className="mt-px text-green-600" />
        <span><span className="font-semibold">{t('correctAnswerTitle')}</span> {t('sampleWorking')}</span>
      </div>
    </div>
  )
}

export default function HomePage() {
  const { t } = useLanguage()
  const { history, drillHistory } = useQuiz()

  // Progress comes from localStorage, so show it only after mount
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const correct = history.filter(h => h.isCorrect).length
  const pct = history.length > 0 ? Math.round((correct / history.length) * 100) : 0
  const hasProgress = mounted && (history.length > 0 || drillHistory.length > 0)

  return (
    <div className="space-y-10">

      {/* --- Hero --- */}
      <section className="grid items-center gap-8 lg:grid-cols-[1.15fr_1fr]">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            <Icon name="book" size={14} /> {t('homeEyebrow')}
          </p>
          <h1 className="text-3xl md:text-[2.6rem] font-bold tracking-tight leading-[1.15] text-slate-900">{t('homeHeadline')}</h1>
          <p className="text-slate-600 md:text-lg max-w-xl">{t('homeSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link href="/practice" className="btn-primary py-3 px-6">
              {t('startSet')} <Icon name="arrowRight" size={16} />
            </Link>
            <Link href="/drill" className="btn-secondary py-3 px-6">
              <Icon name="zap" size={16} className="text-amber-500" /> {t('navDrill')}
            </Link>
          </div>
        </div>

        <div className="relative px-2 py-4 sm:px-6">
          <div className="absolute inset-0 rounded-3xl bg-teal-100/60 -rotate-2" aria-hidden="true" />
          <div className="relative">
            <QuestionPreview />
          </div>
        </div>
      </section>

      {/* --- Progress (only once there is some) --- */}
      {hasProgress && (
        <section className="card px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Icon name="chart" size={18} /></span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{t('yourProgress')}</p>
              <p className="text-sm text-slate-500">{t('progressLine', { n: history.length, pct, rounds: drillHistory.length })}</p>
            </div>
          </div>
          <Link href="/history" className="btn-ghost text-teal-700">{t('viewHistory')} <Icon name="arrowRight" size={16} /></Link>
        </section>
      )}

      {/* --- Modes --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map(mode => (
          <Link
            key={mode.href}
            href={mode.href}
            className="card group p-5 flex flex-col gap-3 transition hover:border-teal-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${mode.tint}`}><Icon name={mode.icon} size={20} /></span>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{t(mode.title)}</p>
              <p className="text-sm text-slate-500">{t(mode.desc)}</p>
            </div>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-teal-700">
              {t('open')} <Icon name="arrowRight" size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </section>

      {/* --- How it works --- */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{t('howItWorks')}</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-teal-600 text-xs font-bold text-teal-700">{i + 1}</span>
              <div>
                <p className="font-semibold text-slate-900">{t(step.title)}</p>
                <p className="text-sm text-slate-500">{t(step.body)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
