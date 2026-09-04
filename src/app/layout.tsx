import type { Metadata, Viewport } from 'next'
import { Geist } from 'next/font/google'
import Providers from '@/components/providers'
import { APP_DESCRIPTION, APP_NAME, APP_SHORT_NAME } from '@/lib/app-config'
import './globals.css'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: APP_SHORT_NAME,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport: Viewport = {
  themeColor: '#111111',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${geist.variable} dark h-full antialiased`}>
      <body className="min-h-full text-white">
        <Providers>
          <div className="app-shell">{children}</div>
        </Providers>
      </body>
    </html>
  )
}
