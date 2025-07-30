'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log critical error
    console.error('CRITICAL GLOBAL ERROR:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    })

    // Always send critical errors to monitoring in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external error tracking (Sentry, LogRocket, etc.)
      // This is critical as it represents a complete app failure
      fetch('/api/error-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GLOBAL_ERROR',
          message: error.message,
          digest: error.digest,
          stack: error.stack,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => {
        // If error tracking fails, at least log to console
        console.error('Failed to send global error to tracking service')
      })
    }
  }, [error])

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full">
            <div className="bg-white shadow-lg rounded-lg p-8 text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 p-4 rounded-full">
                  <AlertTriangle className="h-12 w-12 text-red-600" />
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Application Error
              </h1>
              
              <p className="text-gray-600 mb-6">
                The application encountered a critical error and needs to be restarted. 
                Our team has been automatically notified.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Error Details (Development Mode):
                  </h3>
                  <p className="text-sm text-red-700 break-all">
                    {error.message}
                  </p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Digest: {error.digest}
                    </p>
                  )}
                </div>
              )}
              
              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </button>
                
                <button
                  onClick={handleReload}
                  className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Application
                </button>
                
                <button
                  onClick={handleGoHome}
                  className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  If this problem persists, please contact{' '}
                  <a 
                    href="mailto:support@hireoverseas.com" 
                    className="text-blue-600 hover:text-blue-800"
                  >
                    support@hireoverseas.com
                  </a>
                </p>
                {error.digest && (
                  <p className="text-xs text-gray-400 mt-2">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}