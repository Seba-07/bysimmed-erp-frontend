'use client'

import { useEffect, useState } from 'react'

interface CloudinaryUploadProps {
  onUploadSuccess: (url: string) => void
  currentImage?: string
}

declare global {
  interface Window {
    cloudinary: any
  }
}

export default function CloudinaryUpload({ onUploadSuccess, currentImage }: CloudinaryUploadProps) {
  const [uploading, setUploading] = useState(false)

  const openUploadWidget = () => {
    if (!window.cloudinary) {
      alert('Cloudinary no está cargado. Por favor recarga la página.')
      return
    }

    // Obtener las variables de entorno
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloudName || !uploadPreset) {
      alert('Falta configurar las credenciales de Cloudinary. Por favor contacta al administrador.')
      return
    }

    setUploading(true)

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName: cloudName,
        uploadPreset: uploadPreset,
        sources: ['local', 'camera', 'url'],
        multiple: false,
        maxImageFileSize: 5000000, // 5MB
        maxImageWidth: 2000,
        maxImageHeight: 2000,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        folder: 'erp_products',
        resourceType: 'image',
        styles: {
          palette: {
            window: '#1e293b',
            windowBorder: '#3b82f6',
            tabIcon: '#60a5fa',
            menuIcons: '#94a3b8',
            textDark: '#f1f5f9',
            textLight: '#cbd5e1',
            link: '#60a5fa',
            action: '#3b82f6',
            inactiveTabIcon: '#64748b',
            error: '#ef4444',
            inProgress: '#3b82f6',
            complete: '#10b981',
            sourceBg: '#0f172a'
          },
          fonts: {
            default: null,
            "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif": {
              url: null,
              active: true
            }
          }
        }
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          const imageUrl = result.info.secure_url
          onUploadSuccess(imageUrl)
          setUploading(false)
          widget.close()
        }
        if (error) {
          console.error('Error al subir imagen:', error)
          alert('Error al subir la imagen. Por favor intenta de nuevo.')
          setUploading(false)
        }
      }
    )

    widget.open()
  }

  return (
    <div className="cloudinary-upload">
      <div className="upload-container">
        {currentImage && (
          <div className="current-image-preview">
            <img
              src={currentImage}
              alt="Imagen actual"
              style={{
                maxWidth: '200px',
                maxHeight: '200px',
                objectFit: 'contain',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        )}
        <button
          type="button"
          onClick={openUploadWidget}
          disabled={uploading}
          className="upload-button"
          style={{
            padding: '0.75rem 1.5rem',
            background: uploading ? '#475569' : '#3b82f6',
            color: '#f1f5f9',
            border: 'none',
            borderRadius: '8px',
            cursor: uploading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (!uploading) {
              (e.target as HTMLButtonElement).style.background = '#2563eb'
            }
          }}
          onMouseLeave={(e) => {
            if (!uploading) {
              (e.target as HTMLButtonElement).style.background = '#3b82f6'
            }
          }}
        >
          {uploading ? '📤 Subiendo...' : currentImage ? '🔄 Cambiar Imagen' : '📷 Subir Imagen'}
        </button>
      </div>
    </div>
  )
}
