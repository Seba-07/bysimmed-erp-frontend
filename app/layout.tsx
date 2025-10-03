import type { Metadata } from 'next'
import './globals.css'
import SWRegister from './components/SWRegister'

export const metadata: Metadata = {
  title: 'bySIMMED — Hello PWA',
  description: 'PWA de validación para bySIMMED',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'bySIMMED PWA'
  },
  icons: {
    apple: '/icons/icon-512.png'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-512.png" />
        <script src="https://upload-widget.cloudinary.com/global/all.js" type="text/javascript"></script>
      </head>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  )
}