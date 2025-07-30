import { NextRequest, NextResponse } from 'next/server'
import { createRateLimit, rateLimitConfigs, addRateLimitHeaders } from './rate-limit'
import { createSecurityMiddleware, addSecurityHeaders, logSecurityEvent } from './security'
import { auth } from '@/app/lib/auth'

// Middleware configuration for different route patterns
export interface MiddlewareConfig {
  rateLimit?: {
    windowMs: number
    max: number
    skipSuccessfulRequests?: boolean
    skipFailedRequests?: boolean
  }
  security?: {
    requireAuth?: boolean
    validateCSRF?: boolean
    logRequests?: boolean
    checkSuspicious?: boolean
  }
  cors?: {
    origin?: string | string[]
    methods?: string[]
    headers?: string[]
    credentials?: boolean
  }
}

// Route-specific configurations
export const routeConfigs: Record<string, MiddlewareConfig> = {
  // Authentication routes - strict rate limiting
  '/api/auth': {
    rateLimit: rateLimitConfigs.auth,
    security: {
      requireAuth: false,
      validateCSRF: false,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Admin routes - very strict
  '/api/admin': {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests per minute for admin
    },
    security: {
      requireAuth: true,
      validateCSRF: true,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Employer routes
  '/api/employer': {
    rateLimit: rateLimitConfigs.general,
    security: {
      requireAuth: true,
      validateCSRF: true,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Freelancer routes
  '/api/freelancer': {
    rateLimit: rateLimitConfigs.general,
    security: {
      requireAuth: true,
      validateCSRF: true,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Job routes
  '/api/jobs': {
    rateLimit: rateLimitConfigs.general,
    security: {
      requireAuth: true,
      validateCSRF: true,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Upload routes - limited uploads
  '/api/upload': {
    rateLimit: rateLimitConfigs.upload,
    security: {
      requireAuth: true,
      validateCSRF: true,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Payment routes - very strict
  '/api/payment': {
    rateLimit: rateLimitConfigs.payment,
    security: {
      requireAuth: true,
      validateCSRF: true,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // Messaging routes
  '/api/messages': {
    rateLimit: rateLimitConfigs.messaging,
    security: {
      requireAuth: true,
      validateCSRF: false,
      logRequests: true,
      checkSuspicious: true,
    },
  },
  
  // API routes - standard rate limiting (fallback)
  '/api': {
    rateLimit: rateLimitConfigs.api,
    security: {
      requireAuth: false, // Some APIs are public
      validateCSRF: false, // Handle per endpoint
      logRequests: true,
      checkSuspicious: true,
    },
  },
}

// Apply CORS headers
function applyCORS(request: NextRequest, response: NextResponse, config?: MiddlewareConfig['cors']): NextResponse {
  const origin = request.headers.get('origin')
  
  if (config?.origin) {
    const allowedOrigins = Array.isArray(config.origin) ? config.origin : [config.origin]
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin)
    }
  } else if (process.env.NODE_ENV === 'development') {
    // Allow all origins in development
    response.headers.set('Access-Control-Allow-Origin', origin || '*')
  }
  
  if (config?.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  
  if (config?.methods) {
    response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '))
  } else {
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  }
  
  if (config?.headers) {
    response.headers.set('Access-Control-Allow-Headers', config.headers.join(', '))
  } else {
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Session-Token')
  }
  
  return response
}

// Get configuration for a specific route
function getRouteConfig(pathname: string): MiddlewareConfig {
  // Find the most specific matching route
  const matchingRoute = Object.keys(routeConfigs)
    .sort((a, b) => b.length - a.length) // Sort by length (most specific first)
    .find(route => pathname.startsWith(route))
  
  return matchingRoute ? routeConfigs[matchingRoute] : {}
}

// Main middleware function
export async function applyMiddleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 })
    const config = getRouteConfig(pathname)
    return applyCORS(request, addSecurityHeaders(response), config.cors)
  }
  
  try {
    // Get route-specific configuration
    const config = getRouteConfig(pathname)
    
    // Apply rate limiting
    if (config.rateLimit) {
      const rateLimitMiddleware = createRateLimit(config.rateLimit)
      const rateLimitResponse = await rateLimitMiddleware(request)
      
      if (rateLimitResponse) {
        // Rate limit exceeded
        logSecurityEvent(request, {
          success: false,
          error: 'Rate limit exceeded',
          rateLimited: true,
        })
        
        return applyCORS(request, addSecurityHeaders(rateLimitResponse), config.cors)
      }
    }
    
    // Apply security middleware
    if (config.security) {
      const securityMiddleware = createSecurityMiddleware(config.security)
      const securityResponse = await securityMiddleware(request)
      
      if (securityResponse) {
        // Security check failed
        return applyCORS(request, addSecurityHeaders(securityResponse), config.cors)
      }
    }
    
    // If we get here, all middleware checks passed
    // Create a response that will be modified by the actual route handler
    const response = NextResponse.next()
    
    // Apply security headers
    addSecurityHeaders(response)
    
    // Apply CORS headers
    applyCORS(request, response, config.cors)
    
    return response
    
  } catch (error) {
    console.error('Middleware error:', error)
    
    logSecurityEvent(request, {
      success: false,
      error: error instanceof Error ? error.message : 'Middleware error',
    })
    
    const errorResponse = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    
    return applyCORS(request, addSecurityHeaders(errorResponse))
  }
}

// Helper function to check if user is authenticated (for use in API routes)
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  try {
    const session = await auth()
    
    if (!session) {
      logSecurityEvent(request, {
        success: false,
        error: 'Authentication required',
      })
      
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    return null // User is authenticated
  } catch (error) {
    logSecurityEvent(request, {
      success: false,
      error: 'Authentication check failed',
    })
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    )
  }
}

// Helper function to check user roles
export async function requireRole(request: NextRequest, allowedRoles: string[]): Promise<NextResponse | null> {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    if (!allowedRoles.includes(session.user.role)) {
      logSecurityEvent(request, {
        success: false,
        error: `Insufficient permissions. Required: ${allowedRoles.join(' | ')}, Got: ${session.user.role}`,
        userId: session.user.id,
      })
      
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }
    
    return null // User has required role
  } catch (error) {
    logSecurityEvent(request, {
      success: false,
      error: 'Role check failed',
    })
    
    return NextResponse.json(
      { error: 'Authorization failed' },
      { status: 403 }
    )
  }
}

// Utility function to apply middleware to specific API routes
export function withMiddleware(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config?: MiddlewareConfig
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      // Apply rate limiting if configured
      if (config?.rateLimit) {
        const rateLimitMiddleware = createRateLimit(config.rateLimit)
        const rateLimitResponse = await rateLimitMiddleware(req)
        
        if (rateLimitResponse) {
          return addSecurityHeaders(rateLimitResponse)
        }
      }
      
      // Apply security middleware if configured
      if (config?.security) {
        const securityMiddleware = createSecurityMiddleware(config.security)
        const securityResponse = await securityMiddleware(req)
        
        if (securityResponse) {
          return addSecurityHeaders(securityResponse)
        }
        
        // Check authentication if required
        if (config.security.requireAuth) {
          const authResponse = await requireAuth(req)
          if (authResponse) {
            return addSecurityHeaders(authResponse)
          }
        }
      }
      
      // Call the original handler
      const response = await handler(req, ...args)
      
      // Apply security headers to the response
      return addSecurityHeaders(response)
      
    } catch (error) {
      console.error('Middleware wrapper error:', error)
      
      logSecurityEvent(req, {
        success: false,
        error: error instanceof Error ? error.message : 'Handler error',
      })
      
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
      
      return addSecurityHeaders(errorResponse)
    }
  }
}