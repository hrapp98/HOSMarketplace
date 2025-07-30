import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Security headers configuration
export const securityHeaders = {
  // Prevent XSS attacks
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  
  // HSTS (HTTP Strict Transport Security)
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://api.stripe.com https://checkout.stripe.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=(self)',
    'usb=()',
  ].join(', '),
}

// Apply security headers to response
export function addSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  return response
}

// Generate and verify CSRF tokens
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function verifyCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) return false
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  )
}

// Input sanitization helpers
export function sanitizeString(input: string, maxLength: number = 1000): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, '') // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const sanitized = sanitizeString(email, 254).toLowerCase()
  return emailRegex.test(sanitized) ? sanitized : ''
}

export function sanitizeURL(url: string): string {
  try {
    const parsed = new URL(url)
    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return ''
    }
    return parsed.toString()
  } catch {
    return ''
  }
}

// Request validation
export interface ValidationRule {
  field: string
  required?: boolean
  type?: 'string' | 'number' | 'email' | 'url' | 'boolean'
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  custom?: (value: any) => boolean | string
}

export interface ValidationError {
  field: string
  message: string
}

export function validateRequest(data: any, rules: ValidationRule[]): ValidationError[] {
  const errors: ValidationError[] = []
  
  for (const rule of rules) {
    const value = data[rule.field]
    
    // Check required fields
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors.push({ field: rule.field, message: `${rule.field} is required` })
      continue
    }
    
    // Skip validation if field is not required and empty
    if (!rule.required && (value === undefined || value === null || value === '')) {
      continue
    }
    
    // Type validation
    if (rule.type) {
      switch (rule.type) {
        case 'string':
          if (typeof value !== 'string') {
            errors.push({ field: rule.field, message: `${rule.field} must be a string` })
            continue
          }
          break
        case 'number':
          if (typeof value !== 'number' || isNaN(value)) {
            errors.push({ field: rule.field, message: `${rule.field} must be a number` })
            continue
          }
          break
        case 'email':
          if (!sanitizeEmail(value)) {
            errors.push({ field: rule.field, message: `${rule.field} must be a valid email` })
            continue
          }
          break
        case 'url':
          if (!sanitizeURL(value)) {
            errors.push({ field: rule.field, message: `${rule.field} must be a valid URL` })
            continue
          }
          break
        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push({ field: rule.field, message: `${rule.field} must be a boolean` })
            continue
          }
          break
      }
    }
    
    // String length validation
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push({ 
          field: rule.field, 
          message: `${rule.field} must be at least ${rule.minLength} characters` 
        })
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push({ 
          field: rule.field, 
          message: `${rule.field} must be no more than ${rule.maxLength} characters` 
        })
      }
    }
    
    // Number range validation
    if (typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        errors.push({ field: rule.field, message: `${rule.field} must be at least ${rule.min}` })
      }
      if (rule.max !== undefined && value > rule.max) {
        errors.push({ field: rule.field, message: `${rule.field} must be no more than ${rule.max}` })
      }
    }
    
    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      errors.push({ field: rule.field, message: `${rule.field} format is invalid` })
    }
    
    // Custom validation
    if (rule.custom) {
      const customResult = rule.custom(value)
      if (customResult !== true) {
        errors.push({ 
          field: rule.field, 
          message: typeof customResult === 'string' ? customResult : `${rule.field} is invalid` 
        })
      }
    }
  }
  
  return errors
}

// Request logging for security monitoring
export interface SecurityLog {
  timestamp: Date
  ip: string
  userAgent: string
  method: string
  url: string
  userId?: string
  success: boolean
  error?: string
  rateLimited?: boolean
}

export function logSecurityEvent(req: NextRequest, event: Partial<SecurityLog>): void {
  const log: SecurityLog = {
    timestamp: new Date(),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    method: req.method,
    url: req.url,
    success: true,
    ...event,
  }
  
  // In production, send this to your logging service
  if (process.env.NODE_ENV === 'production') {
    console.log('SECURITY_EVENT:', JSON.stringify(log))
  } else {
    console.log('Security Event:', log)
  }
}

// Detect suspicious patterns
export function detectSuspiciousActivity(req: NextRequest): string[] {
  const suspiciousPatterns: string[] = []
  const userAgent = req.headers.get('user-agent') || ''
  const url = req.url
  
  // Check for suspicious user agents
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /scanner/i,
    /hack/i,
    /attack/i,
    /exploit/i,
  ]
  
  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    suspiciousPatterns.push('suspicious_user_agent')
  }
  
  // Check for path traversal attempts
  if (url.includes('../') || url.includes('..\\')) {
    suspiciousPatterns.push('path_traversal_attempt')
  }
  
  // Check for SQL injection patterns
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /update\s+set/i,
    /exec\s*\(/i,
  ]
  
  if (sqlPatterns.some(pattern => pattern.test(url))) {
    suspiciousPatterns.push('sql_injection_attempt')
  }
  
  // Check for XSS patterns
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+=/i,
    /<iframe/i,
  ]
  
  if (xssPatterns.some(pattern => pattern.test(url))) {
    suspiciousPatterns.push('xss_attempt')
  }
  
  return suspiciousPatterns
}

// API key validation
export function validateAPIKey(apiKey: string): boolean {
  // Add your API key validation logic here
  // This is a simple example - implement proper validation for your use case
  if (!apiKey || apiKey.length < 32) return false
  
  // Check against your stored API keys
  const validAPIKeys = process.env.VALID_API_KEYS?.split(',') || []
  return validAPIKeys.includes(apiKey)
}

// Middleware factory for API security
export function createSecurityMiddleware(options: {
  requireAuth?: boolean
  validateCSRF?: boolean
  logRequests?: boolean
  checkSuspicious?: boolean
} = {}) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const {
      requireAuth = false,
      validateCSRF = false,
      logRequests = true,
      checkSuspicious = true,
    } = options
    
    try {
      // Log request if enabled
      if (logRequests) {
        logSecurityEvent(req, { success: true })
      }
      
      // Check for suspicious activity
      if (checkSuspicious) {
        const suspicious = detectSuspiciousActivity(req)
        if (suspicious.length > 0) {
          logSecurityEvent(req, {
            success: false,
            error: `Suspicious activity detected: ${suspicious.join(', ')}`,
          })
          
          return NextResponse.json(
            { error: 'Request blocked for security reasons' },
            { status: 403 }
          )
        }
      }
      
      // CSRF validation
      if (validateCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        const csrfToken = req.headers.get('x-csrf-token')
        const sessionToken = req.headers.get('x-session-token')
        
        if (!csrfToken || !sessionToken || !verifyCSRFToken(csrfToken, sessionToken)) {
          logSecurityEvent(req, {
            success: false,
            error: 'CSRF token validation failed',
          })
          
          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          )
        }
      }
      
      return null // Continue with request
      
    } catch (error) {
      logSecurityEvent(req, {
        success: false,
        error: error instanceof Error ? error.message : 'Security middleware error',
      })
      
      return NextResponse.json(
        { error: 'Security validation failed' },
        { status: 500 }
      )
    }
  }
}