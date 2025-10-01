'use client'

import { useEffect } from 'react'

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      console.log('🧹 Starting cache cleanup...')

      // Unregister ALL existing service workers
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log(`Found ${registrations.length} service worker(s)`)

        const unregisterPromises = registrations.map((registration) => {
          console.log('🗑️ Unregistering:', registration.scope)
          return registration.unregister()
        })

        return Promise.all(unregisterPromises)
      }).then(() => {
        console.log('✅ All service workers unregistered')

        // Clear all caches
        if ('caches' in window) {
          return caches.keys().then((cacheNames) => {
            console.log(`Found ${cacheNames.length} cache(s)`)

            const deletePromises = cacheNames.map((cacheName) => {
              console.log('🗑️ Deleting cache:', cacheName)
              return caches.delete(cacheName)
            })

            return Promise.all(deletePromises)
          })
        }
      }).then(() => {
        console.log('✅ All caches cleared')
        console.log('🔄 Reloading for fresh content...')

        // Force a hard reload to get fresh content
        window.location.reload()
      }).catch((error) => {
        console.error('❌ Error during cleanup:', error)
      })
    }
  }, [])

  return null
}
