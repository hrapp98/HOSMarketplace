'use client'

import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ErrorFallbackProps {
  error?: Error
  resetErrorBoundary?: () => void
  title?: string
  description?: string
  showErrorDetails?: boolean
  showReportButton?: boolean
}

export function ErrorFallback({
  error,
  resetErrorBoundary,
  title = "Something went wrong",
  description = "We encountered an unexpected error. Please try again or contact support if the problem persists.",
  showErrorDetails = process.env.NODE_ENV === 'development',
  showReportButton = true,
}: ErrorFallbackProps) {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const handleReload = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleReportError = () => {
    const subject = encodeURIComponent('Error Report - HireOverseas')
    const body = encodeURIComponent(`
Error ID: ${errorId}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
User Agent: ${navigator.userAgent}

Error Message: ${error?.message || 'Unknown error'}

Please describe what you were doing when this error occurred:
[Please describe your actions here]
    `.trim())
    
    window.open(`mailto:support@hireoverseas.com?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-xl text-gray-900">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 text-center">
            {description}
          </p>
          
          {showErrorDetails && error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Error Details (Development Mode):
              </h4>
              <div className="space-y-2">
                <p className="text-xs text-red-700">
                  <strong>Message:</strong> {error.message}
                </p>
                {error.stack && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-red-600 hover:text-red-800">
                      Stack Trace
                    </summary>
                    <pre className="mt-2 p-2 bg-red-100 rounded text-red-800 overflow-auto whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {resetErrorBoundary && (
              <Button
                onClick={resetErrorBoundary}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleReload}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>

            {showReportButton && (
              <Button
                onClick={handleReportError}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                <Mail className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            )}
          </div>

          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Error ID: <code className="bg-gray-100 px-1 rounded">{errorId}</code>
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Please include this ID when reporting the issue
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Specific error fallbacks for different scenarios
export function PageErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'description'>) {
  return (
    <ErrorFallback
      {...props}
      title="Page Error"
      description="This page encountered an error and couldn't be displayed properly."
    />
  )
}

export function ComponentErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'description'>) {
  return (
    <ErrorFallback
      {...props}
      title="Component Error"
      description="A component on this page encountered an error."
    />
  )
}

export function DataErrorFallback(props: Omit<ErrorFallbackProps, 'title' | 'description'>) {
  return (
    <ErrorFallback
      {...props}
      title="Data Loading Error"
      description="We couldn't load the data for this page. Please check your connection and try again."
    />
  )
}

// Minimal error display for smaller components
export function MinimalErrorFallback({ 
  error, 
  onRetry 
}: { 
  error?: Error
  onRetry?: () => void 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-6 text-center min-h-[200px]">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-3" />
      <p className="text-sm text-gray-600 mb-3">
        {error?.message || "Something went wrong"}
      </p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline">
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      )}
    </div>
  )
}