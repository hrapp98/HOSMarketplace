'use client'

import { useEffect } from 'react'
import { ErrorFallback } from '@/components/error-fallback'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to console
    console.error('Global error handler:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    })

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to external error tracking (Sentry, LogRocket, etc.)
      console.error('PRODUCTION PAGE ERROR:', {
        message: error.message,
        digest: error.digest,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      })
    }
  }, [error])

  return (
    <ErrorFallback
      error={error}
      resetErrorBoundary={reset}
      title="Page Error"
      description="This page encountered an error and couldn't be loaded properly. Please try refreshing the page or contact support if the problem persists."
      showErrorDetails={process.env.NODE_ENV === 'development'}
    />
  )
}