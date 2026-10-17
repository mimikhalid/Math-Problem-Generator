'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useQuiz } from '../lib/QuizContext'
import { useLanguage, TranslationKey } from '../lib/i18n'

const NAV_ITEMS: { href: string; icon: string; label: TranslationKey }[] = [
  { href: '/', icon: '🏠', label: 'navHome' },
  { href: '/practice', icon: '✏️', label: 'navPractice' },
  { href: '/drill', icon: '⚡', label: 'navDrill' },
  { href: '/worksheet', icon: '🖨️', label: 'navWorksheet' },
  { href: '/history', icon: '📊', label: 'navHistory' },
]

function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <div role="group" aria-label={t('language')} className="inline-flex rounded-lg bg-white/15 p-1 text-sm font-bold">
      {(['en', 'ms'] as const).map(lang => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={`px-3 py-1 rounded-md transition-colors ${language === lang ? 'bg-white text-teal-700 shadow' : 'text-white hover:bg-white/20'}`}
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

  const sidebarContent = (
    <>
      <Link href="/" className="block px-2">
        <span className="block font-extrabold leading-tight">{t('appName')}</span>
        <span className="block text-xs text-teal-100">{t('appTagline')}</span>
      </Link>

      <nav className="mt-8 flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors
                ${active ? 'bg-white text-teal-700 shadow-md' : 'text-white hover:bg-white/15'}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              {t(item.label)}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto space-y-4 pt-8">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-teal-100">{t('language')}</span>
          <LanguageToggle />
        </div>
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full px-4 py-2 text-white/90 hover:text-white hover:bg-white/10 border border-white/25 font-semibold rounded-xl text-sm transition-colors"
        >
          {t('startOver')}
        </button>
        <p className="px-2 text-xs text-teal-100/80">
          {t('developedBy')} <span className="font-semibold text-white">MimiKhalid</span>
        </p>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-teal-700 text-white p-5 shadow-xl print:hidden">
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between bg-teal-700 text-white px-4 py-3 shadow-md print:hidden">
        <button onClick={() => setMenuOpen(true)} aria-label={t('openMenu')} className="text-2xl leading-none px-1">☰</button>
        <span className="font-extrabold truncate px-2">{t('appName')}</span>
        <LanguageToggle />
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-40 print:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] flex flex-col bg-teal-700 text-white p-5 shadow-xl">
            <button onClick={() => setMenuOpen(false)} aria-label={t('close')} className="self-end text-2xl leading-none mb-2">✕</button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="md:pl-64 print:pl-0">
        <main className="px-4 md:px-8 py-6 md:py-8 max-w-5xl mx-auto print:p-0 print:max-w-none">
          {children}
        </main>
      </div>

      {/* Reset confirmation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 print:hidden">
          <div className="card p-6 max-w-sm w-full text-center shadow-xl">
            <h2 className="text-base font-semibold text-slate-800 mb-5">{t('resetConfirm')}</h2>
            <div className="flex justify-center gap-4">
              <button onClick={handleResetQuiz} className="btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500">
                {t('yes')}
              </button>
              <button onClick={() => setShowResetModal(false)} className="btn-secondary">
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
