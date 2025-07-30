import { prisma } from '@/app/lib/prisma'

// Analytics event types
export const ANALYTICS_EVENTS = {
  // User events
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  PROFILE_COMPLETED: 'profile_completed',
  
  // Job events
  JOB_POSTED: 'job_posted',
  JOB_VIEWED: 'job_viewed',
  JOB_APPLIED: 'job_applied',
  JOB_BOOKMARKED: 'job_bookmarked',
  
  // Application events
  APPLICATION_SUBMITTED: 'application_submitted',
  APPLICATION_VIEWED: 'application_viewed',
  APPLICATION_STATUS_CHANGED: 'application_status_changed',
  
  // Payment events
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // Messaging events
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  
  // Search events
  SEARCH_PERFORMED: 'search_performed',
  FILTER_APPLIED: 'filter_applied',
  
  // Engagement events
  PAGE_VIEW: 'page_view',
  FEATURE_USED: 'feature_used',
  BUTTON_CLICKED: 'button_clicked',
} as const

export type AnalyticsEvent = typeof ANALYTICS_EVENTS[keyof typeof ANALYTICS_EVENTS]

// Analytics data interface
export interface AnalyticsData {
  event: AnalyticsEvent
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp?: Date
  ip?: string
  userAgent?: string
  referer?: string
  url?: string
}

// Track analytics event
export async function trackEvent(data: AnalyticsData): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        event: data.event,
        userId: data.userId,
        sessionId: data.sessionId,
        properties: data.properties || {},
        timestamp: data.timestamp || new Date(),
        ip: data.ip,
        userAgent: data.userAgent,
        referer: data.referer,
        url: data.url,
      },
    })

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', {
        event: data.event,
        userId: data.userId,
        properties: data.properties,
      })
    }
  } catch (error) {
    console.error('Failed to track analytics event:', error)
    // Don't throw error to avoid breaking the main flow
  }
}

// Get analytics metrics for admin dashboard
export interface AnalyticsMetrics {
  totalEvents: number
  uniqueUsers: number
  totalPageViews: number
  totalJobViews: number
  totalApplications: number
  totalSearches: number
  conversionRate: number
  topEvents: Array<{ event: string; count: number }>
  userGrowth: Array<{ date: string; users: number }>
  eventTimeline: Array<{ date: string; events: number }>
}

export async function getAnalyticsMetrics(
  startDate: Date,
  endDate: Date
): Promise<AnalyticsMetrics> {
  try {
    const [
      totalEvents,
      uniqueUsers,
      pageViews,
      jobViews,
      applications,
      searches,
      topEventsRaw,
      userGrowthRaw,
      eventTimelineRaw,
    ] = await Promise.all([
      // Total events
      prisma.analyticsEvent.count({
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      
      // Unique users
      prisma.analyticsEvent.findMany({
        where: {
          timestamp: { gte: startDate, lte: endDate },
          userId: { not: null },
        },
        select: { userId: true },
        distinct: ['userId'],
      }),
      
      // Total page views
      prisma.analyticsEvent.count({
        where: {
          event: ANALYTICS_EVENTS.PAGE_VIEW,
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      
      // Total job views
      prisma.analyticsEvent.count({
        where: {
          event: ANALYTICS_EVENTS.JOB_VIEWED,
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      
      // Total applications
      prisma.analyticsEvent.count({
        where: {
          event: ANALYTICS_EVENTS.APPLICATION_SUBMITTED,
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      
      // Total searches
      prisma.analyticsEvent.count({
        where: {
          event: ANALYTICS_EVENTS.SEARCH_PERFORMED,
          timestamp: { gte: startDate, lte: endDate },
        },
      }),
      
      // Top events
      prisma.analyticsEvent.groupBy({
        by: ['event'],
        where: {
          timestamp: { gte: startDate, lte: endDate },
        },
        _count: { event: true },
        orderBy: { _count: { event: 'desc' } },
        take: 10,
      }),
      
      // User growth (daily)
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(DISTINCT user_id) as users
        FROM analytics_events 
        WHERE timestamp >= ${startDate} 
          AND timestamp <= ${endDate}
          AND user_id IS NOT NULL
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      ` as Array<{ date: string; users: bigint }>,
      
      // Event timeline (daily)
      prisma.$queryRaw`
        SELECT 
          DATE(timestamp) as date,
          COUNT(*) as events
        FROM analytics_events 
        WHERE timestamp >= ${startDate} 
          AND timestamp <= ${endDate}
        GROUP BY DATE(timestamp)
        ORDER BY date ASC
      ` as Array<{ date: string; events: bigint }>,
    ])

    // Calculate conversion rate (applications / job views)
    const conversionRate = jobViews > 0 ? (applications / jobViews) * 100 : 0

    return {
      totalEvents,
      uniqueUsers: uniqueUsers.length,
      totalPageViews: pageViews,
      totalJobViews: jobViews,
      totalApplications: applications,
      totalSearches: searches,
      conversionRate: Number(conversionRate.toFixed(2)),
      topEvents: topEventsRaw.map(item => ({
        event: item.event,
        count: item._count.event,
      })),
      userGrowth: userGrowthRaw.map(item => ({
        date: item.date,
        users: Number(item.users),
      })),
      eventTimeline: eventTimelineRaw.map(item => ({
        date: item.date,
        events: Number(item.events),
      })),
    }
  } catch (error) {
    console.error('Failed to get analytics metrics:', error)
    throw error
  }
}

// Get funnel analysis
export interface FunnelStep {
  step: string
  users: number
  conversionRate: number
}

export async function getFunnelAnalysis(
  startDate: Date,
  endDate: Date
): Promise<FunnelStep[]> {
  try {
    const steps = [
      { event: ANALYTICS_EVENTS.PAGE_VIEW, step: 'Page Views' },
      { event: ANALYTICS_EVENTS.JOB_VIEWED, step: 'Job Views' },
      { event: ANALYTICS_EVENTS.APPLICATION_SUBMITTED, step: 'Applications' },
      { event: ANALYTICS_EVENTS.PAYMENT_COMPLETED, step: 'Payments' },
    ]

    const stepData = await Promise.all(
      steps.map(async (step) => {
        const users = await prisma.analyticsEvent.findMany({
          where: {
            event: step.event,
            timestamp: { gte: startDate, lte: endDate },
            userId: { not: null },
          },
          select: { userId: true },
          distinct: ['userId'],
        })
        return { ...step, users: users.length }
      })
    )

    // Calculate conversion rates
    return stepData.map((step, index) => ({
      step: step.step,
      users: step.users,
      conversionRate: index > 0 
        ? Number(((step.users / stepData[0].users) * 100).toFixed(2))
        : 100,
    }))
  } catch (error) {
    console.error('Failed to get funnel analysis:', error)
    throw error
  }
}

// Get user behavior patterns
export interface UserBehavior {
  avgSessionDuration: number
  avgPagesPerSession: number
  bounceRate: number
  topPages: Array<{ page: string; views: number }>
  deviceTypes: Array<{ device: string; percentage: number }>
  trafficSources: Array<{ source: string; percentage: number }>
}

export async function getUserBehavior(
  startDate: Date,
  endDate: Date
): Promise<UserBehavior> {
  try {
    // Get page views data
    const pageViews = await prisma.analyticsEvent.findMany({
      where: {
        event: ANALYTICS_EVENTS.PAGE_VIEW,
        timestamp: { gte: startDate, lte: endDate },
        url: { not: null },
      },
      select: {
        url: true,
        sessionId: true,
        timestamp: true,
        userAgent: true,
        referer: true,
      },
    })

    // Calculate metrics
    const sessions = new Map<string, {
      pages: number
      startTime: Date
      endTime: Date
      userAgent: string
      referer?: string
    }>()

    pageViews.forEach(view => {
      if (!view.sessionId) return
      
      if (!sessions.has(view.sessionId)) {
        sessions.set(view.sessionId, {
          pages: 0,
          startTime: view.timestamp,
          endTime: view.timestamp,
          userAgent: view.userAgent || '',
          referer: view.referer || undefined,
        })
      }

      const session = sessions.get(view.sessionId)!
      session.pages++
      if (view.timestamp < session.startTime) session.startTime = view.timestamp
      if (view.timestamp > session.endTime) session.endTime = view.timestamp
    })

    // Calculate averages
    const sessionArray = Array.from(sessions.values())
    const avgSessionDuration = sessionArray.length > 0
      ? sessionArray.reduce((sum, session) => 
          sum + (session.endTime.getTime() - session.startTime.getTime()), 0
        ) / sessionArray.length / 1000 / 60 // Convert to minutes
      : 0

    const avgPagesPerSession = sessionArray.length > 0
      ? sessionArray.reduce((sum, session) => sum + session.pages, 0) / sessionArray.length
      : 0

    const bounceRate = sessionArray.length > 0
      ? (sessionArray.filter(session => session.pages === 1).length / sessionArray.length) * 100
      : 0

    // Top pages
    const pageUrlCounts = new Map<string, number>()
    pageViews.forEach(view => {
      if (view.url) {
        const url = new URL(view.url).pathname
        pageUrlCounts.set(url, (pageUrlCounts.get(url) || 0) + 1)
      }
    })

    const topPages = Array.from(pageUrlCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([page, views]) => ({ page, views }))

    // Device types (simplified)
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 }
    sessionArray.forEach(session => {
      const ua = session.userAgent.toLowerCase()
      if (ua.includes('mobile')) deviceCounts.mobile++
      else if (ua.includes('tablet')) deviceCounts.tablet++
      else deviceCounts.desktop++
    })

    const totalSessions = sessionArray.length
    const deviceTypes = [
      { device: 'Desktop', percentage: totalSessions > 0 ? Number(((deviceCounts.desktop / totalSessions) * 100).toFixed(1)) : 0 },
      { device: 'Mobile', percentage: totalSessions > 0 ? Number(((deviceCounts.mobile / totalSessions) * 100).toFixed(1)) : 0 },
      { device: 'Tablet', percentage: totalSessions > 0 ? Number(((deviceCounts.tablet / totalSessions) * 100).toFixed(1)) : 0 },
    ]

    // Traffic sources (simplified)
    const sourceCounts = { direct: 0, referral: 0, search: 0, social: 0 }
    sessionArray.forEach(session => {
      if (!session.referer) {
        sourceCounts.direct++
      } else {
        const referer = session.referer.toLowerCase()
        if (referer.includes('google') || referer.includes('bing')) {
          sourceCounts.search++
        } else if (referer.includes('facebook') || referer.includes('twitter') || referer.includes('linkedin')) {
          sourceCounts.social++
        } else {
          sourceCounts.referral++
        }
      }
    })

    const trafficSources = [
      { source: 'Direct', percentage: totalSessions > 0 ? Number(((sourceCounts.direct / totalSessions) * 100).toFixed(1)) : 0 },
      { source: 'Referral', percentage: totalSessions > 0 ? Number(((sourceCounts.referral / totalSessions) * 100).toFixed(1)) : 0 },
      { source: 'Search', percentage: totalSessions > 0 ? Number(((sourceCounts.search / totalSessions) * 100).toFixed(1)) : 0 },
      { source: 'Social', percentage: totalSessions > 0 ? Number(((sourceCounts.social / totalSessions) * 100).toFixed(1)) : 0 },
    ]

    return {
      avgSessionDuration: Number(avgSessionDuration.toFixed(1)),
      avgPagesPerSession: Number(avgPagesPerSession.toFixed(1)),
      bounceRate: Number(bounceRate.toFixed(1)),
      topPages,
      deviceTypes,
      trafficSources,
    }
  } catch (error) {
    console.error('Failed to get user behavior:', error)
    throw error
  }
}

// Utility functions for common tracking scenarios
export const analytics = {
  // Track user registration
  trackUserRegistration: (userId: string, role: string, source?: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.USER_REGISTERED,
      userId,
      properties: { role, source },
    }),

  // Track job posting
  trackJobPosted: (userId: string, jobId: string, jobTitle: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.JOB_POSTED,
      userId,
      properties: { jobId, jobTitle },
    }),

  // Track job view
  trackJobView: (jobId: string, jobTitle: string, userId?: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.JOB_VIEWED,
      userId,
      properties: { jobId, jobTitle },
    }),

  // Track application submission
  trackApplicationSubmitted: (userId: string, jobId: string, applicationId: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.APPLICATION_SUBMITTED,
      userId,
      properties: { jobId, applicationId },
    }),

  // Track payment completion
  trackPaymentCompleted: (userId: string, amount: number, currency: string, jobId?: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.PAYMENT_COMPLETED,
      userId,
      properties: { amount, currency, jobId },
    }),

  // Track search
  trackSearch: (query: string, filters?: Record<string, any>, userId?: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.SEARCH_PERFORMED,
      userId,
      properties: { query, filters },
    }),

  // Track page view
  trackPageView: (url: string, title?: string, userId?: string, sessionId?: string) =>
    trackEvent({
      event: ANALYTICS_EVENTS.PAGE_VIEW,
      userId,
      sessionId,
      url,
      properties: { title },
    }),
}