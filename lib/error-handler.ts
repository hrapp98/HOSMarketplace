import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { recordSecurityAlert, SECURITY_EVENTS } from './security-monitor'

// Error types
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  DATABASE = 'DATABASE',
  EXTERNAL_API = 'EXTERNAL_API',
  FILE_UPLOAD = 'FILE_UPLOAD',
  PAYMENT = 'PAYMENT',
  INTERNAL = 'INTERNAL',
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Structured error interface
export interface APIError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  details?: any
  code?: string
  statusCode: number
  timestamp: Date
  requestId?: string
  userId?: string
}

// Create structured error
export function createError(
  type: ErrorType,
  message: string,
  options: {
    severity?: ErrorSeverity
    details?: any
    code?: string
    statusCode?: number
    requestId?: string
    userId?: string
  } = {}
): APIError {
  const defaultStatusCodes: Record<ErrorType, number> = {
    [ErrorType.VALIDATION]: 400,
    [ErrorType.AUTHENTICATION]: 401,
    [ErrorType.AUTHORIZATION]: 403,
    [ErrorType.NOT_FOUND]: 404,
    [ErrorType.RATE_LIMIT]: 429,
    [ErrorType.DATABASE]: 500,
    [ErrorType.EXTERNAL_API]: 502,
    [ErrorType.FILE_UPLOAD]: 400,
    [ErrorType.PAYMENT]: 402,
    [ErrorType.INTERNAL]: 500,
  }

  const defaultSeverity: Record<ErrorType, ErrorSeverity> = {
    [ErrorType.VALIDATION]: ErrorSeverity.LOW,
    [ErrorType.AUTHENTICATION]: ErrorSeverity.MEDIUM,
    [ErrorType.AUTHORIZATION]: ErrorSeverity.MEDIUM,
    [ErrorType.NOT_FOUND]: ErrorSeverity.LOW,
    [ErrorType.RATE_LIMIT]: ErrorSeverity.MEDIUM,
    [ErrorType.DATABASE]: ErrorSeverity.HIGH,
    [ErrorType.EXTERNAL_API]: ErrorSeverity.MEDIUM,
    [ErrorType.FILE_UPLOAD]: ErrorSeverity.LOW,
    [ErrorType.PAYMENT]: ErrorSeverity.HIGH,
    [ErrorType.INTERNAL]: ErrorSeverity.CRITICAL,
  }

  return {
    type,
    severity: options.severity || defaultSeverity[type],
    message,
    details: options.details,
    code: options.code,
    statusCode: options.statusCode || defaultStatusCodes[type],
    timestamp: new Date(),
    requestId: options.requestId,
    userId: options.userId,
  }
}

// Transform various error types into structured errors
export function transformError(error: unknown, context?: {
  requestId?: string
  userId?: string
  operation?: string
}): APIError {
  // Zod validation errors
  if (error instanceof ZodError) {
    return createError(
      ErrorType.VALIDATION,
      'Validation failed',
      {
        severity: ErrorSeverity.LOW,
        details: error.errors,
        code: 'VALIDATION_ERROR',
        requestId: context?.requestId,
        userId: context?.userId,
      }
    )
  }

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    let message = 'Database operation failed'
    let severity = ErrorSeverity.HIGH
    let statusCode = 500

    switch (error.code) {
      case 'P2002':
        message = 'Record already exists'
        severity = ErrorSeverity.LOW
        statusCode = 409
        break
      case 'P2025':
        message = 'Record not found'
        severity = ErrorSeverity.LOW
        statusCode = 404
        break
      case 'P2003':
        message = 'Foreign key constraint failed'
        severity = ErrorSeverity.MEDIUM
        statusCode = 400
        break
      case 'P2014':
        message = 'Invalid ID provided'
        severity = ErrorSeverity.LOW
        statusCode = 400
        break
    }

    return createError(
      ErrorType.DATABASE,
      message,
      {
        severity,
        statusCode,
        details: {
          code: error.code,
          meta: error.meta,
          operation: context?.operation,
        },
        code: `DATABASE_${error.code}`,
        requestId: context?.requestId,
        userId: context?.userId,
      }
    )
  }

  // Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return createError(
      ErrorType.VALIDATION,
      'Invalid data provided',
      {
        severity: ErrorSeverity.LOW,
        details: { message: error.message },
        code: 'DATABASE_VALIDATION_ERROR',
        requestId: context?.requestId,
        userId: context?.userId,
      }
    )
  }

  // Generic JavaScript errors
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('stripe')) {
      return createError(
        ErrorType.PAYMENT,
        'Payment processing error',
        {
          severity: ErrorSeverity.HIGH,
          details: { originalMessage: error.message },
          code: 'STRIPE_ERROR',
          requestId: context?.requestId,
          userId: context?.userId,
        }
      )
    }

    if (error.message.includes('fetch') || error.message.includes('network')) {
      return createError(
        ErrorType.EXTERNAL_API,
        'External service unavailable',
        {
          severity: ErrorSeverity.MEDIUM,
          details: { originalMessage: error.message },
          code: 'EXTERNAL_API_ERROR',
          requestId: context?.requestId,
          userId: context?.userId,
        }
      )
    }

    if (error.message.includes('upload') || error.message.includes('file')) {
      return createError(
        ErrorType.FILE_UPLOAD,
        'File upload failed',
        {
          severity: ErrorSeverity.LOW,
          details: { originalMessage: error.message },
          code: 'FILE_UPLOAD_ERROR',
          requestId: context?.requestId,
          userId: context?.userId,
        }
      )
    }

    return createError(
      ErrorType.INTERNAL,
      error.message || 'Internal server error',
      {
        severity: ErrorSeverity.CRITICAL,
        details: { 
          stack: error.stack,
          name: error.name,
        },
        code: 'INTERNAL_ERROR',
        requestId: context?.requestId,
        userId: context?.userId,
      }
    )
  }

  // Unknown error type
  return createError(
    ErrorType.INTERNAL,
    'An unexpected error occurred',
    {
      severity: ErrorSeverity.CRITICAL,
      details: { originalError: error },
      code: 'UNKNOWN_ERROR',
      requestId: context?.requestId,
      userId: context?.userId,
    }
  )
}

// Format error response for API
export function formatErrorResponse(error: APIError): {
  error: string
  code?: string
  details?: any
  timestamp: string
  requestId?: string
} {
  // In production, don't expose internal details
  const isProduction = process.env.NODE_ENV === 'production'
  
  const response: any = {
    error: error.message,
    timestamp: error.timestamp.toISOString(),
  }

  if (error.code) {
    response.code = error.code
  }

  if (error.requestId) {
    response.requestId = error.requestId
  }

  // Only include details for non-critical errors in production
  if (!isProduction || error.severity !== ErrorSeverity.CRITICAL) {
    response.details = error.details
  }

  return response
}

// Log error with appropriate level
export function logError(error: APIError, context?: {
  request?: NextRequest
  operation?: string
  additionalData?: any
}): void {
  const logData = {
    type: error.type,
    severity: error.severity,
    message: error.message,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: error.timestamp,
    requestId: error.requestId,
    userId: error.userId,
    operation: context?.operation,
    additionalData: context?.additionalData,
    ...(error.details && { details: error.details }),
  }

  // Log to console with appropriate level
  switch (error.severity) {
    case ErrorSeverity.LOW:
      console.info('ℹ️ API Error (Low):', logData)
      break
    case ErrorSeverity.MEDIUM:
      console.warn('⚠️ API Error (Medium):', logData)
      break
    case ErrorSeverity.HIGH:
      console.error('🚨 API Error (High):', logData)
      break
    case ErrorSeverity.CRITICAL:
      console.error('💥 API Error (Critical):', logData)
      break
  }

  // Record security alert for security-related errors
  if (context?.request && shouldRecordSecurityAlert(error.type)) {
    recordSecurityAlert(
      context.request,
      getSecurityEventType(error.type),
      error.severity,
      {
        errorType: error.type,
        errorCode: error.code,
        userId: error.userId,
        operation: context.operation,
      }
    ).catch(securityError => {
      console.error('Failed to record security alert:', securityError)
    })
  }

  // In production, you might want to send to external monitoring
  if (process.env.NODE_ENV === 'production' && error.severity === ErrorSeverity.CRITICAL) {
    // TODO: Send to external monitoring service (Sentry, DataDog, etc.)
    console.error('CRITICAL ERROR - REQUIRES IMMEDIATE ATTENTION:', JSON.stringify(logData))
  }
}

// Check if error type should trigger security alert
function shouldRecordSecurityAlert(errorType: ErrorType): boolean {
  return [
    ErrorType.AUTHENTICATION,
    ErrorType.AUTHORIZATION,
    ErrorType.RATE_LIMIT,
  ].includes(errorType)
}

// Map error types to security events
function getSecurityEventType(errorType: ErrorType): string {
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      return SECURITY_EVENTS.AUTH_FAILURE
    case ErrorType.AUTHORIZATION:
      return SECURITY_EVENTS.PERMISSION_DENIED
    case ErrorType.RATE_LIMIT:
      return SECURITY_EVENTS.RATE_LIMIT_EXCEEDED
    default:
      return SECURITY_EVENTS.SUSPICIOUS_ACTIVITY
  }
}

// Generate unique request ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Main error handling middleware wrapper
export function withErrorHandler<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>,
  context?: {
    operation?: string
    userId?: string
  }
) {
  return async (...args: T): Promise<NextResponse> => {
    const requestId = generateRequestId()
    
    try {
      return await handler(...args)
    } catch (error) {
      const structuredError = transformError(error, {
        requestId,
        userId: context?.userId,
        operation: context?.operation,
      })

      logError(structuredError, {
        request: args[0] as NextRequest,
        operation: context?.operation,
      })

      return NextResponse.json(
        formatErrorResponse(structuredError),
        { 
          status: structuredError.statusCode,
          headers: {
            'X-Request-ID': requestId,
          },
        }
      )
    }
  }
}

// Predefined error creators for common scenarios
export const errors = {
  notFound: (resource: string = 'Resource') => 
    createError(ErrorType.NOT_FOUND, `${resource} not found`),
  
  unauthorized: (message: string = 'Authentication required') =>
    createError(ErrorType.AUTHENTICATION, message),
  
  forbidden: (message: string = 'Insufficient permissions') =>
    createError(ErrorType.AUTHORIZATION, message),
  
  validation: (message: string = 'Validation failed', details?: any) =>
    createError(ErrorType.VALIDATION, message, { details }),
  
  rateLimited: (message: string = 'Too many requests') =>
    createError(ErrorType.RATE_LIMIT, message),
  
  payment: (message: string = 'Payment processing failed') =>
    createError(ErrorType.PAYMENT, message),
  
  upload: (message: string = 'File upload failed') =>
    createError(ErrorType.FILE_UPLOAD, message),
  
  database: (message: string = 'Database operation failed') =>
    createError(ErrorType.DATABASE, message),
  
  external: (message: string = 'External service error') =>
    createError(ErrorType.EXTERNAL_API, message),
  
  internal: (message: string = 'Internal server error') =>
    createError(ErrorType.INTERNAL, message),
}