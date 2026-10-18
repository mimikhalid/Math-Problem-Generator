import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QuizProvider } from '../lib/QuizContext'
import { LanguageProvider } from '../lib/i18n'
import AppShell from '../components/AppShell'

const inter = Inter({ subsets: ['latin'] })

const SITE_URL = 'https://mathtutor-my.vercel.app'
const SITE_DESCRIPTION = 'Maths practice for Malaysian primary pupils (Year 1–6, KSSR): AI word problems with full working, quick drills and printable worksheets.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'MathTutor MY',
  description: SITE_DESCRIPTION,
  openGraph: {
    title: 'MathTutor MY',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: 'MathTutor MY',
    locale: 'ms_MY',
    type: 'website',
  },
  icons: {
    // This handles the main <link rel="icon" href="/favicon.png" />
    icon: '/favicon.png', 
    // This handles <link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
    apple: '/favicon.png', 
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <QuizProvider>
            <AppShell>{children}</AppShell>
          </QuizProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}