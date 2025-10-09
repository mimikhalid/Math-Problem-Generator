import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { QuizProvider } from '../lib/QuizContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Math Problem Generator',
  description: 'AI-powered math problem generator for Primary 5 students',
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
        <QuizProvider>
          {children}
        </QuizProvider>
      </body>
    </html>
  )
}