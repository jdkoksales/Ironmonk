import type { Metadata, Viewport } from 'next'
import { Inter, Cinzel } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const cinzel = Cinzel({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-cinzel' })

export const metadata: Metadata = {
  title: 'IRON MONK',
  description: 'Jouw persoonlijke Shaolin-meester — 12 weken naar Dengfeng',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'IRON MONK' },
  icons: { icon: '/icons/icon-192.png', apple: '/apple-touch-icon.png' },
}

export const viewport: Viewport = {
  themeColor: '#0B0907',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="bg-bg font-sans text-ink antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})}`,
          }}
        />
      </body>
    </html>
  )
}
