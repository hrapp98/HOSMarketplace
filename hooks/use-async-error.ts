'use client'

import { useCallback, useState } from 'react'
import { reportError } from '@/lib/client-error-handler'

// Hook for handling async errors in React components
export function useAsyncError() {
  const [, setError] = useState<Error | null>(null)

  const throwError = useCallback((error: Error) => {
    // Report the error
    reportError(error, 'ASYNC_ERROR')
    
    // Trigger error boundary by setting state
    setError(() => {
      throw error
    })
  }, [])

  return throwError
}

// Hook for safe async operations with error handling
export function useSafeAsync<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  options: {
    onError?: (error: Error) => void
    defaultValue?: R
    throwOnError?: boolean
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<R | undefined>(options.defaultValue)
  const throwError = useAsyncError()

  const execute = useCallback(async (...args: T): Promise<R | undefined> => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await asyncFn(...args)
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      // Report error
      reportError(error, 'SAFE_ASYNC_ERROR', {
        functionName: asyncFn.name,
        args: args,
      })
      
      // Call custom error handler if provided
      if (options.onError) {
        options.onError(error)
      }
      
      // Throw error to error boundary if requested
      if (options.throwOnError) {
        throwError(error)
      }
      
      return options.defaultValue
    } finally {
      setLoading(false)
    }
  }, [asyncFn, options, throwError])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(options.defaultValue)
  }, [options.defaultValue])

  return {
    execute,
    loading,
    error,
    data,
    reset,
  }
}

// Hook for handling API calls with error reporting
export function useAPICall<T = any>(
  url: string,
  options: RequestInit = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(async (overrideOptions?: RequestInit): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(url, { ...options, ...overrideOptions })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const error = new Error(errorData.error || `HTTP ${response.status}`)
        
        // Report API error
        reportError(error, 'API_CALL_ERROR', {
          url,
          status: response.status,
          statusText: response.statusText,
          method: options.method || 'GET',
          errorData,
        })
        
        throw error
      }

      const result = await response.json()
      setData(result)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      // Report network error if it's not already reported
      if (!error.message.includes('HTTP')) {
        reportError(error, 'NETWORK_ERROR', {
          url,
          method: options.method || 'GET',
        })
      }
      
      return null
    } finally {
      setLoading(false)
    }
  }, [url, options])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    execute,
    loading,
    error,
    data,
    reset,
  }
}

// Hook for form submission with error handling
export function useFormSubmission<T extends Record<string, any>>(
  submitFn: (data: T) => Promise<any>,
  options: {
    onSuccess?: (result: any) => void
    onError?: (error: Error) => void
    resetOnSuccess?: boolean
  } = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [success, setSuccess] = useState(false)

  const submit = useCallback(async (data: T) => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const result = await submitFn(data)
      setSuccess(true)
      
      if (options.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      // Report form submission error
      reportError(error, 'FORM_SUBMISSION_ERROR', {
        formData: data,
        functionName: submitFn.name,
      })
      
      if (options.onError) {
        options.onError(error)
      }
      
      throw error
    } finally {
      setLoading(false)
    }
  }, [submitFn, options])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setSuccess(false)
  }, [])

  return {
    submit,
    loading,
    error,
    success,
    reset,
  }
}