import { Redis } from 'ioredis'

// Initialize Redis client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
})

// Cache key prefixes
export const CACHE_KEYS = {
  USER_PROFILE: 'user:profile:',
  JOB_DETAILS: 'job:details:',
  JOB_LIST: 'job:list:',
  USER_STATS: 'user:stats:',
  SEARCH_RESULTS: 'search:results:',
  ANALYTICS_METRICS: 'analytics:metrics:',
  APPLICATION_COUNT: 'app:count:',
  FREELANCER_PROFILE: 'freelancer:profile:',
  EMPLOYER_PROFILE: 'employer:profile:',
  SKILLS_LIST: 'skills:list',
  TRENDING_JOBS: 'trending:jobs',
  FEATURED_FREELANCERS: 'featured:freelancers',
} as const

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 2 * 60 * 60, // 2 hours
  VERY_LONG: 24 * 60 * 60, // 24 hours
  PERMANENT: 7 * 24 * 60 * 60, // 7 days
} as const

// Generic cache interface
export interface CacheManager {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<void>
  exists(key: string): Promise<boolean>
  ttl(key: string): Promise<number>
  expire(key: string, ttl: number): Promise<void>
}

// Redis cache implementation
class RedisCacheManager implements CacheManager {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    try {
      await redis.setex(key, ttl, JSON.stringify(value))
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      console.error(`Cache delete pattern error for pattern ${pattern}:`, error)
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return (await redis.exists(key)) === 1
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error)
      return false
    }
  }

  async ttl(key: string): Promise<number> {
    try {
      return await redis.ttl(key)
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`, error)
      return -1
    }
  }

  async expire(key: string, ttl: number): Promise<void> {
    try {
      await redis.expire(key, ttl)
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`, error)
    }
  }
}

// In-memory cache fallback
class MemoryCacheManager implements CacheManager {
  private cache = new Map<string, { value: any; expires: number }>()

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }

  async set<T>(key: string, value: T, ttl: number = CACHE_TTL.MEDIUM): Promise<void> {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key)
    if (!item) return false
    
    if (Date.now() > item.expires) {
      this.cache.delete(key)
      return false
    }
    
    return true
  }

  async ttl(key: string): Promise<number> {
    const item = this.cache.get(key)
    if (!item) return -2
    
    const remaining = Math.floor((item.expires - Date.now()) / 1000)
    return remaining > 0 ? remaining : -1
  }

  async expire(key: string, ttl: number): Promise<void> {
    const item = this.cache.get(key)
    if (item) {
      item.expires = Date.now() + ttl * 1000
    }
  }
}

// Export cache manager instance
export const cache: CacheManager = process.env.REDIS_URL 
  ? new RedisCacheManager()
  : new MemoryCacheManager()

// Cache utility functions
export async function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await cache.get<T>(key)
    if (cached !== null) {
      return cached
    }

    // Fetch fresh data
    const data = await fetcher()
    
    // Cache the result
    await cache.set(key, data, ttl)
    
    return data
  } catch (error) {
    console.error(`Cache utility error for key ${key}:`, error)
    // Return fresh data if caching fails
    return await fetcher()
  }
}

// Cache invalidation helpers
export const cacheInvalidation = {
  // Invalidate user-related caches
  invalidateUser: async (userId: string) => {
    await Promise.all([
      cache.del(`${CACHE_KEYS.USER_PROFILE}${userId}`),
      cache.del(`${CACHE_KEYS.USER_STATS}${userId}`),
      cache.del(`${CACHE_KEYS.FREELANCER_PROFILE}${userId}`),
      cache.del(`${CACHE_KEYS.EMPLOYER_PROFILE}${userId}`),
    ])
  },

  // Invalidate job-related caches
  invalidateJob: async (jobId: string) => {
    await Promise.all([
      cache.del(`${CACHE_KEYS.JOB_DETAILS}${jobId}`),
      cache.del(`${CACHE_KEYS.APPLICATION_COUNT}${jobId}`),
      cache.delPattern(`${CACHE_KEYS.JOB_LIST}*`), // Invalidate all job lists
      cache.delPattern(`${CACHE_KEYS.SEARCH_RESULTS}*`), // Invalidate search results
      cache.del(CACHE_KEYS.TRENDING_JOBS),
    ])
  },

  // Invalidate search caches
  invalidateSearch: async () => {
    await cache.delPattern(`${CACHE_KEYS.SEARCH_RESULTS}*`)
  },

  // Invalidate analytics caches
  invalidateAnalytics: async () => {
    await cache.delPattern(`${CACHE_KEYS.ANALYTICS_METRICS}*`)
  },

  // Invalidate all caches (use with caution)
  invalidateAll: async () => {
    await cache.delPattern('*')
  },
}

// Cache warming functions
export const cacheWarming = {
  // Warm up job listings cache
  warmJobListings: async () => {
    // This would typically fetch popular job queries and cache them
    console.log('Warming job listings cache...')
  },

  // Warm up user profiles cache
  warmUserProfiles: async (userIds: string[]) => {
    console.log(`Warming user profiles cache for ${userIds.length} users...`)
  },

  // Warm up analytics cache
  warmAnalytics: async () => {
    console.log('Warming analytics cache...')
  },
}

// Cache monitoring
export const cacheMonitoring = {
  // Get cache statistics
  getStats: async () => {
    try {
      if (process.env.REDIS_URL) {
        const info = await redis.info('memory')
        return {
          type: 'redis',
          memory: info,
        }
      } else {
        return {
          type: 'memory',
          size: (cache as any).cache?.size || 0,
        }
      }
    } catch (error) {
      console.error('Error getting cache stats:', error)
      return null
    }
  },

  // Health check
  healthCheck: async (): Promise<boolean> => {
    try {
      const testKey = 'health:check'
      const testValue = Date.now().toString()
      
      await cache.set(testKey, testValue, 60)
      const retrieved = await cache.get<string>(testKey)
      await cache.del(testKey)
      
      return retrieved === testValue
    } catch (error) {
      console.error('Cache health check failed:', error)
      return false
    }
  },
}

// Background cache maintenance
export const cacheMaintenance = {
  // Clean up expired keys (for memory cache)
  cleanup: async () => {
    if (!(cache instanceof MemoryCacheManager)) return
    
    const memoryCache = cache as any
    let cleaned = 0
    
    for (const [key, item] of memoryCache.cache.entries()) {
      if (Date.now() > item.expires) {
        memoryCache.cache.delete(key)
        cleaned++
      }
    }
    
    console.log(`Cleaned up ${cleaned} expired cache entries`)
    return cleaned
  },
}

// Export Redis client for advanced operations
export { redis }