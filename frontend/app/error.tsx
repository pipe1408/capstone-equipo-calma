'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('❌ Capturado por error.tsx:', error)
  }, [error])

  return (
    <html>
      <body className="flex h-screen items-center justify-center bg-red-50">
        <div className="max-w-md text-center p-6 rounded-xl border border-red-200 bg-white shadow">
          <h2 className="text-2xl font-bold text-red-600 mb-2">¡Algo salió mal! 😞</h2>
          <p className="text-sm text-gray-700 mb-4">
            {error?.message || 'Error inesperado. Inténtalo de nuevo.'}
          </p>
          <button
            onClick={() => reset()}
            className="bg-red-500 hover:bg-red-400 text-white px-4 py-2 rounded-lg font-semibold"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}