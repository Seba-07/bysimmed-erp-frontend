'use client'

import { useEffect } from 'react'

export default function SWRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((registration) => {
          console.log('[PWA] Service Worker registrado:', registration.scope)
        })
        .catch((error) => {
          console.error('[PWA] Error al registrar Service Worker:', error)
        })
    }
  }, [])

  return null
}