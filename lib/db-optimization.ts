import { prisma } from '@/app/lib/prisma'
import { cache, getCached, CACHE_KEYS, CACHE_TTL } from './cache'
import { trackDBQuery } from './performance'

// Database query optimization utilities
export class DBOptimizer {
  // Optimized user profile query with caching
  static async getUserProfile(userId: string) {
    return getCached(
      `${CACHE_KEYS.USER_PROFILE}${userId}`,
      () => trackDBQuery('user_profile', () =>
        prisma.user.findUnique({
          where: { id: userId },
          include: {
            profile: true,
            freelancerProfile: {
              include: {
                skills: {
                  include: {
                    skill: true,
                  },
                },
                education: true,
                experience: true,
                certifications: true,
              },
            },
            employerProfile: true,
            subscription: true,
            _count: {
              select: {
                jobsPosted: true,
                applications: true,
                reviews: true,
                reviewsReceived: true,
              },
            },
          },
        })
      ),
      CACHE_TTL.MEDIUM
    )
  }

  // Optimized job details query with caching
  static async getJobDetails(jobId: string) {
    return getCached(
      `${CACHE_KEYS.JOB_DETAILS}${jobId}`,
      () => trackDBQuery('job_details', () =>
        prisma.job.findUnique({
          where: { id: jobId },
          include: {
            employer: {
              include: {
                profile: true,
                employerProfile: true,
              },
            },
            skills: {
              include: {
                skill: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        })
      ),
      CACHE_TTL.MEDIUM
    )
  }

  // Optimized job listings with pagination and caching
  static async getJobListings(
    page: number = 1,
    limit: number = 20,
    filters: {
      search?: string
      skills?: string[]
      location?: string
      experienceLevel?: string
      minSalary?: number
      maxSalary?: number
      isRemote?: boolean
    } = {}
  ) {
    const cacheKey = `${CACHE_KEYS.JOB_LIST}${JSON.stringify({ page, limit, filters })}`
    
    return getCached(
      cacheKey,
      () => trackDBQuery('job_listings', async () => {
        const skip = (page - 1) * limit
        
        // Build where clause
        const where: any = {
          status: 'ACTIVE',
          publishedAt: { lte: new Date() },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        }

        if (filters.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ]
        }

        if (filters.skills && filters.skills.length > 0) {
          where.skills = {
            some: {
              skill: {
                name: { in: filters.skills },
              },
            },
          }
        }

        if (filters.location) {
          where.location = { contains: filters.location, mode: 'insensitive' }
        }

        if (filters.experienceLevel) {
          where.experienceLevel = filters.experienceLevel
        }

        if (filters.minSalary) {
          where.salaryMin = { gte: filters.minSalary }
        }

        if (filters.maxSalary) {
          where.salaryMax = { lte: filters.maxSalary }
        }

        if (filters.isRemote !== undefined) {
          where.isRemote = filters.isRemote
        }

        // Execute query with optimized includes
        const [jobs, total] = await Promise.all([
          prisma.job.findMany({
            where,
            include: {
              employer: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      firstName: true,
                      lastName: true,
                      avatar: true,
                      country: true,
                    },
                  },
                  employerProfile: {
                    select: {
                      companyName: true,
                      companyLogo: true,
                    },
                  },
                },
              },
              skills: {
                select: {
                  skill: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                  isRequired: true,
                },
              },
              _count: {
                select: {
                  applications: true,
                },
              },
            },
            orderBy: [
              { publishedAt: 'desc' },
              { createdAt: 'desc' },
            ],
            skip,
            take: limit,
          }),
          prisma.job.count({ where }),
        ])

        return {
          jobs,
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        }
      }),
      CACHE_TTL.SHORT
    )
  }

  // Optimized freelancer search with caching
  static async searchFreelancers(
    filters: {
      skills?: string[]
      location?: string
      minRate?: number
      maxRate?: number
      experienceLevel?: string
      availability?: string
      search?: string
    } = {},
    page: number = 1,
    limit: number = 20
  ) {
    const cacheKey = `freelancers:search:${JSON.stringify({ filters, page, limit })}`
    
    return getCached(
      cacheKey,
      () => trackDBQuery('freelancer_search', async () => {
        const skip = (page - 1) * limit
        
        const where: any = {
          role: 'FREELANCER',
          isActive: true,
          freelancerProfile: {
            isNot: null,
          },
        }

        if (filters.search) {
          where.OR = [
            { profile: { firstName: { contains: filters.search, mode: 'insensitive' } } },
            { profile: { lastName: { contains: filters.search, mode: 'insensitive' } } },
            { freelancerProfile: { title: { contains: filters.search, mode: 'insensitive' } } },
            { freelancerProfile: { bio: { contains: filters.search, mode: 'insensitive' } } },
          ]
        }

        if (filters.skills && filters.skills.length > 0) {
          where.freelancerProfile.skills = {
            some: {
              skill: {
                name: { in: filters.skills },
              },
            },
          }
        }

        if (filters.location) {
          where.profile = {
            country: { contains: filters.location, mode: 'insensitive' },
          }
        }

        if (filters.minRate || filters.maxRate) {
          where.freelancerProfile.hourlyRate = {}
          if (filters.minRate) where.freelancerProfile.hourlyRate.gte = filters.minRate
          if (filters.maxRate) where.freelancerProfile.hourlyRate.lte = filters.maxRate
        }

        const [freelancers, total] = await Promise.all([
          prisma.user.findMany({
            where,
            include: {
              profile: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                  country: true,
                },
              },
              freelancerProfile: {
                include: {
                  skills: {
                    take: 10, // Limit skills for performance
                    include: {
                      skill: {
                        select: {
                          id: true,
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
              _count: {
                select: {
                  reviews: true,
                  applications: true,
                },
              },
            },
            orderBy: [
              { lastActive: 'desc' },
              { createdAt: 'desc' },
            ],
            skip,
            take: limit,
          }),
          prisma.user.count({ where }),
        ])

        return {
          freelancers,
          total,
          pages: Math.ceil(total / limit),
          currentPage: page,
        }
      }),
      CACHE_TTL.SHORT
    )
  }

  // Optimized application count with caching
  static async getApplicationCount(jobId: string) {
    return getCached(
      `${CACHE_KEYS.APPLICATION_COUNT}${jobId}`,
      () => trackDBQuery('application_count', () =>
        prisma.application.count({
          where: { jobId },
        })
      ),
      CACHE_TTL.MEDIUM
    )
  }

  // Batch operations for better performance
  static async batchGetUsers(userIds: string[]) {
    // Check cache first for each user
    const cachedUsers: Record<string, any> = {}
    const uncachedIds: string[] = []

    for (const id of userIds) {
      const cached = await cache.get(`${CACHE_KEYS.USER_PROFILE}${id}`)
      if (cached) {
        cachedUsers[id] = cached
      } else {
        uncachedIds.push(id)
      }
    }

    // Fetch uncached users in a single query
    let freshUsers: any[] = []
    if (uncachedIds.length > 0) {
      freshUsers = await trackDBQuery('batch_users', () =>
        prisma.user.findMany({
          where: { id: { in: uncachedIds } },
          include: {
            profile: true,
            freelancerProfile: {
              include: {
                skills: {
                  include: { skill: true },
                },
              },
            },
            employerProfile: true,
          },
        })
      )

      // Cache the fresh results
      for (const user of freshUsers) {
        await cache.set(`${CACHE_KEYS.USER_PROFILE}${user.id}`, user, CACHE_TTL.MEDIUM)
      }
    }

    // Combine cached and fresh results
    const allUsers = [...Object.values(cachedUsers), ...freshUsers]
    return allUsers.sort((a, b) => userIds.indexOf(a.id) - userIds.indexOf(b.id))
  }

  // Trending jobs with caching
  static async getTrendingJobs(limit: number = 10) {
    return getCached(
      CACHE_KEYS.TRENDING_JOBS,
      () => trackDBQuery('trending_jobs', () =>
        prisma.job.findMany({
          where: {
            status: 'ACTIVE',
            publishedAt: { lte: new Date() },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
          },
          include: {
            employer: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                employerProfile: {
                  select: {
                    companyName: true,
                    companyLogo: true,
                  },
                },
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
          orderBy: [
            { applicationCount: 'desc' },
            { viewCount: 'desc' },
          ],
          take: limit,
        })
      ),
      CACHE_TTL.LONG
    )
  }

  // Featured freelancers with caching
  static async getFeaturedFreelancers(limit: number = 12) {
    return getCached(
      CACHE_KEYS.FEATURED_FREELANCERS,
      () => trackDBQuery('featured_freelancers', () =>
        prisma.user.findMany({
          where: {
            role: 'FREELANCER',
            isActive: true,
            freelancerProfile: {
              isNot: null,
              completionPercentage: { gte: 90 },
            },
          },
          include: {
            profile: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
                country: true,
              },
            },
            freelancerProfile: {
              select: {
                title: true,
                bio: true,
                hourlyRate: true,
                totalEarnings: true,
              },
            },
            _count: {
              select: {
                reviewsReceived: true,
              },
            },
          },
          orderBy: [
            { lastActive: 'desc' },
            { createdAt: 'desc' },
          ],
          take: limit,
        })
      ),
      CACHE_TTL.LONG
    )
  }

  // Database health check
  static async healthCheck() {
    try {
      const start = performance.now()
      await prisma.$queryRaw`SELECT 1`
      const responseTime = performance.now() - start
      
      return {
        status: 'healthy',
        responseTime: Math.round(responseTime),
        timestamp: new Date(),
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: (error as Error).message,
        timestamp: new Date(),
      }
    }
  }
}

// Query builder for complex searches
export class QueryBuilder {
  private where: any = {}
  private includes: any = {}
  private orderBy: any[] = []
  private pagination: { skip?: number; take?: number } = {}

  // Add where conditions
  addWhere(conditions: any) {
    this.where = { ...this.where, ...conditions }
    return this
  }

  // Add includes
  addInclude(includes: any) {
    this.includes = { ...this.includes, ...includes }
    return this
  }

  // Add ordering
  addOrderBy(field: string, direction: 'asc' | 'desc' = 'desc') {
    this.orderBy.push({ [field]: direction })
    return this
  }

  // Add pagination
  paginate(page: number, limit: number) {
    this.pagination = {
      skip: (page - 1) * limit,
      take: limit,
    }
    return this
  }

  // Build the final query object
  build() {
    return {
      where: this.where,
      include: this.includes,
      orderBy: this.orderBy,
      ...this.pagination,
    }
  }
}

// Connection pooling utilities
export const connectionPool = {
  // Get pool status
  getStatus: async () => {
    try {
      // This would require access to the underlying connection
      return {
        active: 'unknown',
        idle: 'unknown',
        total: 'unknown',
      }
    } catch (error) {
      return null
    }
  },

  // Warm up connections
  warmUp: async () => {
    try {
      // Execute a few simple queries to warm up the pool
      await Promise.all([
        prisma.user.count(),
        prisma.job.count(),
        prisma.application.count(),
      ])
      console.log('Database connection pool warmed up')
    } catch (error) {
      console.error('Failed to warm up connection pool:', error)
    }
  },
}