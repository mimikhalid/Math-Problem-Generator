'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useLanguage, TranslationKey } from '../lib/i18n'
import { useQuiz } from '../lib/QuizContext'

const MODES: { href: string; icon: string; title: TranslationKey; desc: TranslationKey; tint: string }[] = [
  { href: '/practice', icon: '✏️', title: 'navPractice', desc: 'modePracticeDesc', tint: 'bg-teal-50 text-teal-700' },
  { href: '/drill', icon: '⚡', title: 'navDrill', desc: 'modeDrillDesc', tint: 'bg-amber-50 text-amber-700' },
  { href: '/worksheet', icon: '🖨️', title: 'navWorksheet', desc: 'modeWorksheetDesc', tint: 'bg-orange-50 text-orange-700' },
]

const STEPS: { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'step1Title', body: 'step1Body' },
  { title: 'step2Title', body: 'step2Body' },
  { title: 'step3Title', body: 'step3Body' },
]

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
    <div className="space-y-8">

      {/* --- Hero --- */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-10 md:px-10 md:py-14 text-white shadow-sm">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-20 right-24 h-40 w-40 rounded-full bg-white/5" aria-hidden="true" />
        <div className="relative max-w-2xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-100">{t('homeEyebrow')}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{t('homeHeadline')}</h1>
          <p className="text-teal-50/90 md:text-lg">{t('homeSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/practice" className="btn bg-white text-teal-800 hover:bg-teal-50 focus-visible:ring-white focus-visible:ring-offset-teal-700 py-3">
              {t('startSet')} →
            </Link>
            <Link href="/drill" className="btn border border-white/40 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-teal-700 py-3">
              ⚡ {t('navDrill')}
            </Link>
          </div>
        </div>
      </section>

      {/* --- Progress (only once there is some) --- */}
      {hasProgress && (
        <section className="card px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{t('yourProgress')}</p>
            <p className="text-sm text-slate-500">{t('progressLine', { n: history.length, pct, rounds: drillHistory.length })}</p>
          </div>
          <Link href="/history" className="btn-ghost text-teal-700">{t('viewHistory')} →</Link>
        </section>
      )}

      {/* --- Modes --- */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {MODES.map(mode => (
          <Link
            key={mode.href}
            href={mode.href}
            className="card group p-5 flex flex-col gap-3 transition hover:-translate-y-0.5 hover:shadow-md hover:border-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl ${mode.tint}`} aria-hidden="true">{mode.icon}</span>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">{t(mode.title)}</p>
              <p className="text-sm text-slate-500">{t(mode.desc)}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform">{t('open')} →</span>
          </Link>
        ))}
      </section>

      {/* --- How it works --- */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">{t('howItWorks')}</h2>
        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-bold text-white">{i + 1}</span>
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
