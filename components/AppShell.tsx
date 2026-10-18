'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuiz } from '../lib/QuizContext'
import { useLanguage, TranslationKey } from '../lib/i18n'
import Icon, { IconName } from './Icon'

const NAV_ITEMS: { href: string; icon: IconName; label: TranslationKey }[] = [
  { href: '/', icon: 'home', label: 'navHome' },
  { href: '/practice', icon: 'pencil', label: 'navPractice' },
  { href: '/drill', icon: 'zap', label: 'navDrill' },
  { href: '/worksheet', icon: 'printer', label: 'navWorksheet' },
  { href: '/history', icon: 'chart', label: 'navHistory' },
]

/** Brand mark: a maths tile with plus and minus signs. */
function LogoMark() {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
        <path d="M7 4v6M4 7h6" />
        <path d="M14 7h6" />
        <path d="M5 15l4 4M9 15l-4 4" />
        <path d="M14 15.5h6M14 18.5h6" />
      </svg>
    </span>
  )
}

function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div role="group" aria-label={t('language')} className="inline-flex rounded-lg bg-slate-100 p-0.5 text-xs font-semibold">
      {(['en', 'ms'] as const).map(lang => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={`px-2.5 py-1 rounded-md transition-colors ${language === lang ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          {lang === 'en' ? 'EN' : 'BM'}
        </button>
      ))}
    </div>
  )
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { t } = useLanguage()
  const { setScore, setHistory, setDrillHistory, setCurrentProblem } = useQuiz()

  const [menuOpen, setMenuOpen] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)

  useEffect(() => setMenuOpen(false), [pathname])

  const handleResetQuiz = () => {
    setScore(0)
    setHistory([])
    setDrillHistory([])
    setCurrentProblem(null)
    localStorage.removeItem('quizScore')
    localStorage.removeItem('quizHistory')
    localStorage.removeItem('drillHistory')
    setShowResetModal(false)
  }

  const brand = (
    <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
      <LogoMark />
      <span className="leading-tight">
        <span className="block font-bold text-slate-900">
          MathTutor <span className="ml-0.5 rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-bold text-teal-700 align-middle">MY</span>
        </span>
        <span className="block text-xs text-slate-500">{t('appTagline')}</span>
      </span>
    </Link>
  )

  const sidebarContent = (
    <>
      {brand}

      <nav className="mt-8 flex flex-col gap-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
                ${active ? 'bg-teal-50 text-teal-800 font-semibold' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'}`}
            >
              <Icon name={item.icon} size={18} className={active ? 'text-teal-600' : 'text-slate-400'} />
              {t(item.label)}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-3 pt-8">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-slate-500">{t('language')}</span>
          <LanguageToggle />
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
        >
          <Icon name="rotate" size={16} /> {t('startOver')}
        </button>
        <p className="border-t border-slate-100 px-1 pt-3 text-xs text-slate-400">
          {t('developedBy')} <span className="font-semibold text-slate-600">MimiKhalid</span>
        </p>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col border-r border-slate-200 bg-white p-5 print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 backdrop-blur px-4 py-2.5 print:hidden">
        <button onClick={() => setMenuOpen(true)} aria-label={t('openMenu')} className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100">
          <Icon name="menu" size={22} />
        </button>
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-900">
          <LogoMark /> MathTutor
        </Link>
        <LanguageToggle />
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 print:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] flex flex-col bg-white p-5 shadow-xl">
            <button onClick={() => setMenuOpen(false)} aria-label={t('close')} className="self-end rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 mb-2">
              <Icon name="close" size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="md:pl-64 print:pl-0">
        <main className="px-4 md:px-10 py-6 md:py-10 max-w-5xl mx-auto print:p-0 print:max-w-none">
          {children}
        </main>
      </div>

      {/* Reset confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="card p-6 max-w-sm w-full text-center shadow-xl">
            <h2 className="text-base font-semibold text-slate-800 mb-5">{t('resetConfirm')}</h2>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowResetModal(false)} className="btn-secondary">
                {t('cancel')}
              </button>
              <button onClick={handleResetQuiz} className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500">
                {t('yes')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
