'use client'

import { useEffect } from 'react'
import { useAnalytics } from '@/components/analytics/analytics-provider'
import { useSession } from 'next-auth/react'

// Custom hook for easy analytics integration in components
export function useAnalyticsIntegration() {
  const analytics = useAnalytics()
  const { data: session } = useSession()

  // Track feature usage
  const trackFeatureUsage = (feature: string, context?: Record<string, any>) => {
    analytics.trackEvent('feature_used', {
      feature,
      userRole: session?.user?.role,
      ...context,
    })
  }

  // Track button clicks
  const trackButtonClick = (buttonName: string, location: string, context?: Record<string, any>) => {
    analytics.trackEvent('button_clicked', {
      buttonName,
      location,
      userRole: session?.user?.role,
      ...context,
    })
  }

  // Track form submissions
  const trackFormSubmission = (formName: string, success: boolean, context?: Record<string, any>) => {
    analytics.trackEvent('form_submitted', {
      formName,
      success,
      userRole: session?.user?.role,
      ...context,
    })
  }

  // Track modal/dialog interactions
  const trackModalInteraction = (modalName: string, action: 'opened' | 'closed' | 'submitted', context?: Record<string, any>) => {
    analytics.trackEvent('modal_interaction', {
      modalName,
      action,
      userRole: session?.user?.role,
      ...context,
    })
  }

  // Track user engagement
  const trackEngagement = (engagementType: string, duration?: number, context?: Record<string, any>) => {
    analytics.trackEvent('user_engagement', {
      engagementType,
      duration,
      userRole: session?.user?.role,
      ...context,
    })
  }

  // Track errors (for analytics, not error reporting)
  const trackUserError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
    analytics.trackEvent('user_error', {
      errorType,
      errorMessage,
      userRole: session?.user?.role,
      ...context,
    })
  }

  return {
    // Core analytics functions
    trackEvent: analytics.trackEvent,
    trackPageView: analytics.trackPageView,
    trackJobView: analytics.trackJobView,
    trackJobApplication: analytics.trackJobApplication,
    trackSearch: analytics.trackSearch,
    trackPayment: analytics.trackPayment,
    
    // Enhanced tracking functions
    trackFeatureUsage,
    trackButtonClick,
    trackFormSubmission,
    trackModalInteraction,
    trackEngagement,
    trackUserError,
  }
}

// Hook for tracking page time and scroll depth
export function usePageAnalytics(pageName?: string) {
  const analytics = useAnalytics()
  const { data: session } = useSession()

  useEffect(() => {
    const startTime = Date.now()
    let maxScrollDepth = 0

    // Track scroll depth
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight
      const scrollDepth = documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 100
      
      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth
      }
    }

    // Track time on page
    const handleBeforeUnload = () => {
      const timeOnPage = Date.now() - startTime
      
      analytics.trackEvent('page_engagement', {
        pageName: pageName || window.location.pathname,
        timeOnPage: Math.round(timeOnPage / 1000), // Convert to seconds
        maxScrollDepth,
        userRole: session?.user?.role,
      })
    }

    // Track 30-second milestone
    const thirtySecondTimer = setTimeout(() => {
      analytics.trackEvent('page_milestone', {
        pageName: pageName || window.location.pathname,
        milestone: '30_seconds',
        scrollDepth: maxScrollDepth,
        userRole: session?.user?.role,
      })
    }, 30000)

    // Track 2-minute milestone
    const twoMinuteTimer = setTimeout(() => {
      analytics.trackEvent('page_milestone', {
        pageName: pageName || window.location.pathname,
        milestone: '2_minutes',
        scrollDepth: maxScrollDepth,
        userRole: session?.user?.role,
      })
    }, 120000)

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      clearTimeout(thirtySecondTimer)
      clearTimeout(twoMinuteTimer)
      
      // Track final page engagement on component unmount
      const timeOnPage = Date.now() - startTime
      analytics.trackEvent('page_engagement', {
        pageName: pageName || window.location.pathname,
        timeOnPage: Math.round(timeOnPage / 1000),
        maxScrollDepth,
        userRole: session?.user?.role,
      })
    }
  }, [analytics, pageName, session?.user?.role])
}

// Hook for A/B testing analytics
export function useABTestAnalytics(testName: string, variant: string) {
  const analytics = useAnalytics()
  const { data: session } = useSession()

  useEffect(() => {
    analytics.trackEvent('ab_test_exposure', {
      testName,
      variant,
      userRole: session?.user?.role,
    })
  }, [analytics, testName, variant, session?.user?.role])

  const trackConversion = (conversionType: string, value?: number) => {
    analytics.trackEvent('ab_test_conversion', {
      testName,
      variant,
      conversionType,
      value,
      userRole: session?.user?.role,
    })
  }

  return { trackConversion }
}