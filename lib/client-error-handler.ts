'use client'

// Client-side error handling utilities

interface ClientError {
  type: string
  message: string
  stack?: string
  url?: string
  userAgent?: string
  timestamp?: string
  userId?: string
  sessionId?: string
  additionalData?: any
}

// Send error to tracking endpoint
async function sendErrorToTracking(error: ClientError): Promise<void> {
  try {
    await fetch('/api/error-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...error,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (trackingError) {
    console.error('Failed to send error to tracking service:', trackingError)
  }
}

// Global error handlers for unhandled errors
export function setupGlobalErrorHandlers(): void {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    const error: ClientError = {
      type: 'GLOBAL_JS_ERROR',
      message: event.message,
      stack: event.error?.stack,
      additionalData: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    }

    console.error('Global JavaScript error:', error)
    sendErrorToTracking(error)
  })

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error: ClientError = {
      type: 'UNHANDLED_PROMISE_REJECTION',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack,
      additionalData: {
        reason: event.reason,
      },
    }

    console.error('Unhandled promise rejection:', error)
    sendErrorToTracking(error)
  })

  // Handle resource loading errors
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as HTMLElement
      const error: ClientError = {
        type: 'RESOURCE_LOAD_ERROR',
        message: `Failed to load resource: ${target.tagName}`,
        additionalData: {
          tagName: target.tagName,
          src: (target as any).src || (target as any).href,
          id: target.id,
          className: target.className,
        },
      }

      console.error('Resource load error:', error)
      sendErrorToTracking(error)
    }
  }, true)

  console.log('Global error handlers set up successfully')
}

// Manual error reporting function
export function reportError(
  error: Error | string,
  type: string = 'MANUAL_REPORT',
  additionalData?: any
): void {
  const clientError: ClientError = {
    type,
    message: typeof error === 'string' ? error : error.message,
    stack: typeof error === 'object' ? error.stack : undefined,
    additionalData,
  }

  console.error('Manual error report:', clientError)
  sendErrorToTracking(clientError)
}

// React error boundary reporting
export function reportReactError(
  error: Error,
  errorInfo: { componentStack: string },
  additionalData?: any
): void {
  const clientError: ClientError = {
    type: 'REACT_ERROR_BOUNDARY',
    message: error.message,
    stack: error.stack,
    additionalData: {
      componentStack: errorInfo.componentStack,
      ...additionalData,
    },
  }

  console.error('React error boundary:', clientError)
  sendErrorToTracking(clientError)
}

// API error reporting
export function reportAPIError(
  endpoint: string,
  status: number,
  message: string,
  response?: any
): void {
  const error: ClientError = {
    type: 'API_ERROR',
    message: `API Error: ${message}`,
    additionalData: {
      endpoint,
      status,
      response,
      method: 'Unknown', // This could be passed as parameter
    },
  }

  console.error('API error:', error)
  sendErrorToTracking(error)
}

// Network error reporting
export function reportNetworkError(
  url: string,
  error: Error,
  additionalData?: any
): void {
  const clientError: ClientError = {
    type: 'NETWORK_ERROR',
    message: `Network error: ${error.message}`,
    stack: error.stack,
    additionalData: {
      url,
      ...additionalData,
    },
  }

  console.error('Network error:', clientError)
  sendErrorToTracking(clientError)
}

// Performance error reporting
export function reportPerformanceIssue(
  metric: string,
  value: number,
  threshold: number,
  additionalData?: any
): void {
  const error: ClientError = {
    type: 'PERFORMANCE_ISSUE',
    message: `Performance issue: ${metric} (${value}ms) exceeded threshold (${threshold}ms)`,
    additionalData: {
      metric,
      value,
      threshold,
      ...additionalData,
    },
  }

  console.warn('Performance issue:', error)
  sendErrorToTracking(error)
}

// Validation error reporting
export function reportValidationError(
  field: string,
  value: any,
  rule: string,
  additionalData?: any
): void {
  const error: ClientError = {
    type: 'VALIDATION_ERROR',
    message: `Validation error: ${field} failed ${rule} validation`,
    additionalData: {
      field,
      value,
      rule,
      ...additionalData,
    },
  }

  console.warn('Validation error:', error)
  sendErrorToTracking(error)
}

// User action error reporting
export function reportUserActionError(
  action: string,
  error: Error,
  context?: any
): void {
  const clientError: ClientError = {
    type: 'USER_ACTION_ERROR',
    message: `User action error: ${action} - ${error.message}`,
    stack: error.stack,
    additionalData: {
      action,
      context,
    },
  }

  console.error('User action error:', clientError)
  sendErrorToTracking(clientError)
}

// Initialize error tracking
export function initializeErrorTracking(): void {
  if (typeof window !== 'undefined') {
    setupGlobalErrorHandlers()
    
    // Report when error tracking is initialized
    console.log('Client-side error tracking initialized')
  }
}