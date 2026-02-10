'use client'

import React, { ReactNode, useState, useEffect } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorState {
  hasError: boolean
  error: Error | null
}

export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const [state, setState] = useState<ErrorState>({
    hasError: false,
    error: null,
  })

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Error caught by Error Boundary:', event.error)
      setState({
        hasError: true,
        error: event.error,
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason)
      setState({
        hasError: true,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  if (state.hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md border border-red-200">
          <div className="mb-4">
            <svg
              className="w-12 h-12 text-red-600 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4v2m0 0v2M12 15l0 0m0-8l0 0m8 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Алдаа гарлаа</h1>
          <p className="text-gray-600 mb-6 text-center">
            Өгөгдмөл алдаа гарлаа. Та хуудсыг дахин ачааллаж оролдоно уу.
          </p>
          {state.error && process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-xs text-red-700 overflow-auto max-h-32">
              <p className="font-mono font-bold mb-1">Debug Info:</p>
              <p>{state.error.message}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setState({ hasError: false, error: null })
              }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Дахин оролдох
            </button>
            <button
              onClick={() => {
                window.location.href = '/'
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
            >
              Нүүр хуудас
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
