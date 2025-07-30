'use client'

import { createContext, useContext, useEffect, useCallback, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { analytics } from '@/lib/analytics'

interface AnalyticsContextType {
  trackEvent: (event: string, properties?: Record<string, any>) => void
  trackPageView: (url?: string, title?: string) => void
  trackJobView: (jobId: string, jobTitle: string) => void
  trackJobApplication: (jobId: string, applicationId: string) => void
  trackSearch: (query: string, filters?: Record<string, any>) => void
  trackPayment: (amount: number, currency: string, jobId?: string) => void
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined)

// Generate or get session ID
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

// Send analytics event to API
async function sendAnalyticsEvent(data: {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  url?: string
  referer?: string
  userAgent?: string
  ip?: string
}): Promise<void> {
  try {
    await fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString(),
        url: data.url || window.location.href,
        referer: document.referrer || undefined,
        userAgent: navigator.userAgent,
      }),
    })
  } catch (error) {
    // Fail silently to avoid disrupting user experience
    console.error('Failed to send analytics event:', error)
  }
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const sessionId = getSessionId()
  const userId = session?.user?.id

  // Track page views automatically
  useEffect(() => {
    if (pathname) {
      sendAnalyticsEvent({
        event: 'page_view',
        userId,
        sessionId,
        properties: {
          title: document.title,
          path: pathname,
        },
      })
    }
  }, [pathname, userId, sessionId])

  const trackEvent = useCallback((event: string, properties?: Record<string, any>) => {
    sendAnalyticsEvent({
      event,
      userId,
      sessionId,
      properties,
    })
  }, [userId, sessionId])

  const trackPageView = useCallback((url?: string, title?: string) => {
    sendAnalyticsEvent({
      event: 'page_view',
      userId,
      sessionId,
      properties: {
        title: title || document.title,
        path: url || pathname,
      },
    })
  }, [userId, sessionId, pathname])

  const trackJobView = useCallback((jobId: string, jobTitle: string) => {
    sendAnalyticsEvent({
      event: 'job_viewed',
      userId,
      sessionId,
      properties: { jobId, jobTitle },
    })
  }, [userId, sessionId])

  const trackJobApplication = useCallback((jobId: string, applicationId: string) => {
    sendAnalyticsEvent({
      event: 'application_submitted',
      userId,
      sessionId,
      properties: { jobId, applicationId },
    })
  }, [userId, sessionId])

  const trackSearch = useCallback((query: string, filters?: Record<string, any>) => {
    sendAnalyticsEvent({
      event: 'search_performed',
      userId,
      sessionId,
      properties: { query, filters },
    })
  }, [userId, sessionId])

  const trackPayment = useCallback((amount: number, currency: string, jobId?: string) => {
    sendAnalyticsEvent({
      event: 'payment_completed',
      userId,
      sessionId,
      properties: { amount, currency, jobId },
    })
  }, [userId, sessionId])

  const value: AnalyticsContextType = {
    trackEvent,
    trackPageView,
    trackJobView,
    trackJobApplication,
    trackSearch,
    trackPayment,
  }

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics(): AnalyticsContextType {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}