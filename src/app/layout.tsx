import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Training Log',
  description: 'シンプルなトレーニング記録アプリ',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full bg-[#111111] text-white">{children}</body>
    </html>
  )
}
