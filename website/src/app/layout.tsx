import '@/styles/globals.css'
import type { Metadata } from 'next'
import { Inter, Chakra_Petch, Bangers } from 'next/font/google'
import { APP_CONFIG } from '@/lib/config'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const chakra = Chakra_Petch({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-chakra' })
const bangers = Bangers({ weight: '400', subsets: ['latin'], variable: '--font-bangers' })

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  keywords: ['productivity', 'developer tools', 'browser extension', 'vscode extension'],
  authors: [{ name: APP_CONFIG.name }],
  creator: APP_CONFIG.name,
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: APP_CONFIG.url,
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    creator: '@voidapp',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${chakra.variable} ${bangers.variable}`}>
      <body className="antialiased bg-void-black text-void-white">{children}</body>
    </html>
  )
}

