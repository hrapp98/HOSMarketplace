import { NextRequest, NextResponse } from 'next/server'
import { Redis } from 'ioredis'

// Redis client for rate limiting storage
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 1,
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum number of requests per window
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: NextRequest) => string
}

export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  resetTime: Date
}

// Default key generator - uses IP address
const defaultKeyGenerator = (req: NextRequest): string => {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : req.ip || 'unknown'
  return `rate_limit:${ip}`
}

// Rate limit implementation
export async function rateLimit(
  req: NextRequest,
  config: RateLimitConfig
): Promise<{ allowed: boolean; info: RateLimitInfo }> {
  const keyGenerator = config.keyGenerator || defaultKeyGenerator
  const key = keyGenerator(req)
  const windowStart = Math.floor(Date.now() / config.windowMs)
  const redisKey = `${key}:${windowStart}`

  try {
    // Get current count
    const current = await redis.get(redisKey)
    const count = current ? parseInt(current) : 0

    // Calculate reset time
    const resetTime = new Date((windowStart + 1) * config.windowMs)

    const info: RateLimitInfo = {
      limit: config.max,
      remaining: Math.max(0, config.max - count - 1),
      reset: Math.ceil(resetTime.getTime() / 1000),
      resetTime,
    }

    if (count >= config.max) {
      return { allowed: false, info }
    }

    // Increment counter
    await redis
      .multi()
      .incr(redisKey)
      .expire(redisKey, Math.ceil(config.windowMs / 1000))
      .exec()

    return { allowed: true, info }
  } catch (error) {
    console.error('Rate limit error:', error)
    // If Redis fails, allow the request but log the error
    return {
      allowed: true,
      info: {
        limit: config.max,
        remaining: config.max - 1,
        reset: Math.ceil((Date.now() + config.windowMs) / 1000),
        resetTime: new Date(Date.now() + config.windowMs),
      },
    }
  }
}

// Rate limit middleware factory
export function createRateLimit(config: RateLimitConfig) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const { allowed, info } = await rateLimit(req, config)

    if (!allowed) {
      const response = NextResponse.json(
        {
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${Math.ceil(
            (info.resetTime.getTime() - Date.now()) / 1000
          )} seconds.`,
        },
        { status: 429 }
      )

      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', info.limit.toString())
      response.headers.set('X-RateLimit-Remaining', info.remaining.toString())
      response.headers.set('X-RateLimit-Reset', info.reset.toString())
      response.headers.set('Retry-After', Math.ceil((info.resetTime.getTime() - Date.now()) / 1000).toString())

      return response
    }

    return null // Allow request to continue
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Strict limits for authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
  },
  
  // API endpoints
  api: {
    windowMs: 60 * 1000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '60'),
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
  },
  
  // Payment endpoints
  payment: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 payment attempts per minute
  },
  
  // Message endpoints
  messaging: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
  },
}

// User-specific rate limiting (requires authentication)
export async function createUserRateLimit(userId: string, config: RateLimitConfig) {
  return createRateLimit({
    ...config,
    keyGenerator: () => `rate_limit:user:${userId}`,
  })
}

// Clean up expired keys (run periodically)
export async function cleanupRateLimitKeys(): Promise<void> {
  try {
    const pattern = 'rate_limit:*'
    const keys = await redis.keys(pattern)
    
    if (keys.length > 0) {
      const pipeline = redis.pipeline()
      
      for (const key of keys) {
        const ttl = await redis.ttl(key)
        // Remove keys that have expired or have no TTL set
        if (ttl === -1 || ttl === -2) {
          pipeline.del(key)
        }
      }
      
      await pipeline.exec()
      console.log(`Cleaned up ${keys.length} rate limit keys`)
    }
  } catch (error) {
    console.error('Error cleaning up rate limit keys:', error)
  }
}

// Utility function to add rate limit headers to any response
export function addRateLimitHeaders(response: NextResponse, info: RateLimitInfo): NextResponse {
  response.headers.set('X-RateLimit-Limit', info.limit.toString())
  response.headers.set('X-RateLimit-Remaining', info.remaining.toString())
  response.headers.set('X-RateLimit-Reset', info.reset.toString())
  return response
}