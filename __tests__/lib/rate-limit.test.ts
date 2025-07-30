// Rate limiting tests
import { rateLimit, RateLimitConfig } from '@/lib/rate-limit'
import { NextRequest } from 'next/server'
import Redis from 'ioredis'

// Mock Redis (already mocked in jest.setup.js)
jest.mock('ioredis')

describe('Rate Limiting', () => {
  let mockRedis: jest.Mocked<Redis>

  beforeEach(() => {
    jest.resetAllMocks()
    
    // Get the mocked Redis instance
    mockRedis = {
      get: jest.fn(),
      set: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      exists: jest.fn(),
      ttl: jest.fn(),
      expire: jest.fn(),
      incr: jest.fn(),
      multi: jest.fn(() => ({
        incr: jest.fn(),
        expire: jest.fn(),
        exec: jest.fn(),
      })),
      lpush: jest.fn(),
      ltrim: jest.fn(),
      lrange: jest.fn(),
      lrem: jest.fn(),
      info: jest.fn(),
      disconnect: jest.fn(),
    } as any

    // Mock the Redis constructor to return our mocked instance
    ;(Redis as any).mockImplementation(() => mockRedis)
  })

  const createMockRequest = (ip: string = '192.168.1.1', headers: Record<string, string> = {}) => {
    return {
      ip,
      headers: new Headers(headers),
      nextUrl: { pathname: '/api/test' },
    } as NextRequest
  }

  const defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 10,
    message: 'Too many requests',
  }

  describe('basic rate limiting', () => {
    it('should allow requests within rate limit', async () => {
      const req = createMockRequest()
      mockRedis.get.mockResolvedValue('5') // Current count
      mockRedis.ttl.mockResolvedValue(30) // 30 seconds remaining

      const result = await rateLimit(req, defaultConfig)

      expect(result.allowed).toBe(true)
      expect(result.info.remaining).toBe(5) // 10 - 5 = 5
      expect(result.info.resetTime).toBeGreaterThan(Date.now())
    })

    it('should block requests exceeding rate limit', async () => {
      const req = createMockRequest()
      mockRedis.get.mockResolvedValue('15') // Exceeds limit of 10
      mockRedis.ttl.mockResolvedValue(30)

      const result = await rateLimit(req, defaultConfig)

      expect(result.allowed).toBe(false)
      expect(result.info.remaining).toBe(0)
      expect(result.info.resetTime).toBeGreaterThan(Date.now())
    })

    it('should increment counter for new requests', async () => {
      const req = createMockRequest()
      mockRedis.get.mockResolvedValue(null) // No existing count
      
      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 1], [null, 'OK']]),
      }
      mockRedis.multi.mockReturnValue(mockMulti as any)

      const result = await rateLimit(req, defaultConfig)

      expect(mockRedis.multi).toHaveBeenCalled()
      expect(mockMulti.incr).toHaveBeenCalledWith('rate_limit:192.168.1.1:/api/test')
      expect(mockMulti.expire).toHaveBeenCalledWith('rate_limit:192.168.1.1:/api/test', 60)
      expect(result.allowed).toBe(true)
      expect(result.info.remaining).toBe(9) // 10 - 1 = 9
    })
  })

  describe('IP address handling', () => {
    it('should use x-forwarded-for header when available', async () => {
      const req = createMockRequest('127.0.0.1', { 'x-forwarded-for': '203.0.113.1, 198.51.100.1' })
      mockRedis.get.mockResolvedValue('5')
      mockRedis.ttl.mockResolvedValue(30)

      await rateLimit(req, defaultConfig)

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:203.0.113.1:/api/test')
    })

    it('should use x-real-ip header as fallback', async () => {
      const req = createMockRequest('127.0.0.1', { 'x-real-ip': '203.0.113.1' })
      mockRedis.get.mockResolvedValue('5')
      mockRedis.ttl.mockResolvedValue(30)

      await rateLimit(req, defaultConfig)

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:203.0.113.1:/api/test')
    })

    it('should fallback to request IP when headers not available', async () => {
      const req = createMockRequest('192.168.1.100')
      mockRedis.get.mockResolvedValue('5')
      mockRedis.ttl.mockResolvedValue(30)

      await rateLimit(req, defaultConfig)

      expect(mockRedis.get).toHaveBeenCalledWith('rate_limit:192.168.1.100:/api/test')
    })
  })

  describe('different rate limit configurations', () => {
    it('should handle different window sizes', async () => {
      const req = createMockRequest()
      const config: RateLimitConfig = {
        windowMs: 300000, // 5 minutes
        maxRequests: 50,
        message: 'Rate limited',
      }

      mockRedis.get.mockResolvedValue(null)
      const mockMulti = {
        incr: jest.fn().mockReturnThis(),
        expire: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([[null, 1], [null, 'OK']]),
      }
      mockRedis.multi.mockReturnValue(mockMulti as any)

      await rateLimit(req, config)

      expect(mockMulti.expire).toHaveBeenCalledWith('rate_limit:192.168.1.1:/api/test', 300)
    })

    it('should handle custom skip conditions', async () => {
      const req = createMockRequest()
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Rate limited',
        skip: (req) => req.ip === '192.168.1.1', // Skip this IP
      }

      const result = await rateLimit(req, config)

      expect(result.allowed).toBe(true)
      expect(mockRedis.get).not.toHaveBeenCalled() // Should skip Redis operations
    })

    it('should handle custom key generators', async () => {
      const req = createMockRequest()
      const config: RateLimitConfig = {
        windowMs: 60000,
        maxRequests: 10,
        message: 'Rate limited',
        keyGenerator: (req) => `custom:${req.ip}`,
      }

      mockRedis.get.mockResolvedValue('5')
      mockRedis.ttl.mockResolvedValue(30)

      await rateLimit(req, config)

      expect(mockRedis.get).toHaveBeenCalledWith('custom:192.168.1.1')
    })
  })

  describe('error handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      const req = createMockRequest()
      mockRedis.get.mockRejectedValue(new Error('Redis connection failed'))

      const result = await rateLimit(req, defaultConfig)

      // Should allow request when Redis is unavailable
      expect(result.allowed).toBe(true)
      expect(result.info.remaining).toBe(defaultConfig.maxRequests)
    })

    it('should handle Redis timeout errors', async () => {
      const req = createMockRequest()
      mockRedis.get.mockImplementation(() => new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Redis timeout')), 100)
      }))

      const result = await rateLimit(req, defaultConfig)

      expect(result.allowed).toBe(true)
    })

    it('should handle malformed Redis responses', async () => {
      const req = createMockRequest()
      mockRedis.get.mockResolvedValue('invalid-number')
      mockRedis.ttl.mockResolvedValue(-1)

      const result = await rateLimit(req, defaultConfig)

      // Should treat invalid count as 0 and allow request
      expect(result.allowed).toBe(true)
    })
  })

  describe('rate limit headers', () => {
    it('should provide correct rate limit information', async () => {
      const req = createMockRequest()
      mockRedis.get.mockResolvedValue('7')
      mockRedis.ttl.mockResolvedValue(45) // 45 seconds remaining

      const result = await rateLimit(req, defaultConfig)

      expect(result.info.limit).toBe(10)
      expect(result.info.remaining).toBe(3) // 10 - 7 = 3
      expect(result.info.resetTime).toBeCloseTo(Date.now() + 45000, -3) // Within 1 second
    })

    it('should handle negative TTL values', async () => {
      const req = createMockRequest()
      mockRedis.get.mockResolvedValue('5')
      mockRedis.ttl.mockResolvedValue(-1) // Key has no expiration

      const result = await rateLimit(req, defaultConfig)

      expect(result.allowed).toBe(true)
      expect(result.info.resetTime).toBeCloseTo(Date.now() + defaultConfig.windowMs, -3)
    })
  })

  describe('concurrent requests', () => {
    it('should handle concurrent requests correctly', async () => {
      const req1 = createMockRequest('192.168.1.1')
      const req2 = createMockRequest('192.168.1.1')
      
      mockRedis.get.mockResolvedValue('9') // Close to limit
      mockRedis.ttl.mockResolvedValue(30)

      const [result1, result2] = await Promise.all([
        rateLimit(req1, defaultConfig),
        rateLimit(req2, defaultConfig)
      ])

      // Both should see the same count initially
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result1.info.remaining).toBe(1)
      expect(result2.info.remaining).toBe(1)
    })
  })
})