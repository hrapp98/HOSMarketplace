// Analytics system tests
import { 
  trackEvent, 
  getAnalyticsMetrics, 
  AnalyticsData,
  ANALYTICS_EVENTS 
} from '@/lib/analytics'
import { prisma } from '@/app/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Analytics System', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('trackEvent', () => {
    it('should track analytics events successfully', async () => {
      const eventData: AnalyticsData = {
        event: ANALYTICS_EVENTS.JOB_POSTED,
        userId: 'user-123',
        sessionId: 'session-456',
        metadata: {
          jobId: 'job-789',
          jobTitle: 'Frontend Developer',
          category: 'Technology',
        },
      }

      const mockAnalyticsEvent = {
        id: 'analytics-123',
        ...eventData,
        createdAt: new Date(),
      }

      mockPrisma.analyticsEvent.create.mockResolvedValue(mockAnalyticsEvent as any)

      await trackEvent(eventData)

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          event: ANALYTICS_EVENTS.JOB_POSTED,
          userId: 'user-123',
          sessionId: 'session-456',
          metadata: {
            jobId: 'job-789',
            jobTitle: 'Frontend Developer',
            category: 'Technology',
          },
        },
      })
    })

    it('should handle events without user ID', async () => {
      const eventData: AnalyticsData = {
        event: ANALYTICS_EVENTS.PAGE_VIEW,
        sessionId: 'session-456',
        metadata: {
          page: '/jobs',
          referrer: 'https://google.com',
        },
      }

      mockPrisma.analyticsEvent.create.mockResolvedValue({} as any)

      await trackEvent(eventData)

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: {
          event: ANALYTICS_EVENTS.PAGE_VIEW,
          userId: undefined,
          sessionId: 'session-456',
          metadata: {
            page: '/jobs',
            referrer: 'https://google.com',
          },
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      const eventData: AnalyticsData = {
        event: ANALYTICS_EVENTS.USER_REGISTERED,
        userId: 'user-123',
        sessionId: 'session-456',
      }

      const error = new Error('Database connection failed')
      mockPrisma.analyticsEvent.create.mockRejectedValue(error)

      // Should not throw error, just log it
      await expect(trackEvent(eventData)).resolves.not.toThrow()
    })

    it('should validate required fields', async () => {
      const invalidEventData = {
        // Missing required 'event' field
        userId: 'user-123',
        sessionId: 'session-456',
      } as AnalyticsData

      await expect(trackEvent(invalidEventData)).rejects.toThrow()
    })
  })

  describe('getAnalyticsMetrics', () => {
    it('should get analytics metrics for date range', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      const mockMetrics = [
        { event: ANALYTICS_EVENTS.JOB_POSTED, count: 150 },
        { event: ANALYTICS_EVENTS.APPLICATION_SUBMITTED, count: 500 },
        { event: ANALYTICS_EVENTS.USER_REGISTERED, count: 75 },
      ]

      mockPrisma.analyticsEvent.groupBy.mockResolvedValue(mockMetrics as any)

      const metrics = await getAnalyticsMetrics({ startDate, endDate })

      expect(mockPrisma.analyticsEvent.groupBy).toHaveBeenCalledWith({
        by: ['event'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      })

      expect(metrics).toEqual([
        { event: ANALYTICS_EVENTS.JOB_POSTED, count: 150 },
        { event: ANALYTICS_EVENTS.APPLICATION_SUBMITTED, count: 500 },
        { event: ANALYTICS_EVENTS.USER_REGISTERED, count: 75 },
      ])
    })

    it('should filter metrics by user ID', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const userId = 'user-123'

      mockPrisma.analyticsEvent.groupBy.mockResolvedValue([])

      await getAnalyticsMetrics({ startDate, endDate, userId })

      expect(mockPrisma.analyticsEvent.groupBy).toHaveBeenCalledWith({
        by: ['event'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          userId,
        },
      })
    })

    it('should filter metrics by event type', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const events = [ANALYTICS_EVENTS.JOB_POSTED, ANALYTICS_EVENTS.APPLICATION_SUBMITTED]

      mockPrisma.analyticsEvent.groupBy.mockResolvedValue([])

      await getAnalyticsMetrics({ startDate, endDate, events })

      expect(mockPrisma.analyticsEvent.groupBy).toHaveBeenCalledWith({
        by: ['event'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          event: {
            in: events,
          },
        },
      })
    })

    it('should handle database errors', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')
      const error = new Error('Database query failed')

      mockPrisma.analyticsEvent.groupBy.mockRejectedValue(error)

      await expect(getAnalyticsMetrics({ startDate, endDate })).rejects.toThrow('Database query failed')
    })

    it('should return empty array when no data found', async () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-31')

      mockPrisma.analyticsEvent.groupBy.mockResolvedValue([])

      const metrics = await getAnalyticsMetrics({ startDate, endDate })

      expect(metrics).toEqual([])
    })
  })

  describe('ANALYTICS_EVENTS constants', () => {
    it('should have all required analytics events', () => {
      expect(ANALYTICS_EVENTS.PAGE_VIEW).toBe('page_view')
      expect(ANALYTICS_EVENTS.USER_REGISTERED).toBe('user_registered')
      expect(ANALYTICS_EVENTS.USER_LOGIN).toBe('user_login')
      expect(ANALYTICS_EVENTS.JOB_POSTED).toBe('job_posted')
      expect(ANALYTICS_EVENTS.JOB_VIEWED).toBe('job_viewed')
      expect(ANALYTICS_EVENTS.APPLICATION_SUBMITTED).toBe('application_submitted')
      expect(ANALYTICS_EVENTS.MESSAGE_SENT).toBe('message_sent')
      expect(ANALYTICS_EVENTS.PAYMENT_INITIATED).toBe('payment_initiated')
      expect(ANALYTICS_EVENTS.PAYMENT_COMPLETED).toBe('payment_completed')
      expect(ANALYTICS_EVENTS.PROFILE_UPDATED).toBe('profile_updated')
    })

    it('should have unique event names', () => {
      const eventValues = Object.values(ANALYTICS_EVENTS)
      const uniqueValues = [...new Set(eventValues)]
      
      expect(eventValues.length).toBe(uniqueValues.length)
    })
  })

  describe('real-world usage scenarios', () => {
    it('should track user registration flow', async () => {
      mockPrisma.analyticsEvent.create.mockResolvedValue({} as any)

      // Track page view
      await trackEvent({
        event: ANALYTICS_EVENTS.PAGE_VIEW,
        sessionId: 'session-123',
        metadata: { page: '/register' },
      })

      // Track successful registration
      await trackEvent({
        event: ANALYTICS_EVENTS.USER_REGISTERED,
        userId: 'user-456',
        sessionId: 'session-123',
        metadata: { 
          role: 'FREELANCER',
          source: 'organic',
        },
      })

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledTimes(2)
    })

    it('should track job posting flow', async () => {
      mockPrisma.analyticsEvent.create.mockResolvedValue({} as any)

      // Track job creation
      await trackEvent({
        event: ANALYTICS_EVENTS.JOB_POSTED,
        userId: 'employer-123',
        sessionId: 'session-456',
        metadata: {
          jobId: 'job-789',
          category: 'Technology',
          budget: 5000,
        },
      })

      // Track job views
      await trackEvent({
        event: ANALYTICS_EVENTS.JOB_VIEWED,
        userId: 'freelancer-456',
        sessionId: 'session-789',
        metadata: {
          jobId: 'job-789',
          viewDuration: 45000, // 45 seconds
        },
      })

      // Track application
      await trackEvent({
        event: ANALYTICS_EVENTS.APPLICATION_SUBMITTED,
        userId: 'freelancer-456',
        sessionId: 'session-789',
        metadata: {
          jobId: 'job-789',
          applicationId: 'app-123',
        },
      })

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledTimes(3)
    })

    it('should track payment flow', async () => {
      mockPrisma.analyticsEvent.create.mockResolvedValue({} as any)

      // Track payment initiation
      await trackEvent({
        event: ANALYTICS_EVENTS.PAYMENT_INITIATED,
        userId: 'employer-123',
        sessionId: 'session-456',
        metadata: {
          amount: 5000,
          currency: 'USD',
          jobId: 'job-789',
        },
      })

      // Track payment completion
      await trackEvent({
        event: ANALYTICS_EVENTS.PAYMENT_COMPLETED,
        userId: 'employer-123',
        sessionId: 'session-456',
        metadata: {
          paymentId: 'payment-123',
          amount: 5000,
          currency: 'USD',
          jobId: 'job-789',
        },
      })

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledTimes(2)
    })
  })
})