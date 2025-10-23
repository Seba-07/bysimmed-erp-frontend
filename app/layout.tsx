import type { Metadata } from 'next'
import './globals.css'
import SWRegister from './components/SWRegister'
import Sidebar from './components/Sidebar'

export const metadata: Metadata = {
  title: 'bySIMMED ERP — Sistema de Gestión Empresarial',
  description: 'Sistema ERP completo para gestión de ventas, finanzas, inventario y producción',
  manifest: '/manifest.json',
  themeColor: '#0f172a',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'bySIMMED ERP'
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
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
        <SWRegister />
      </body>
    </html>
  )
}