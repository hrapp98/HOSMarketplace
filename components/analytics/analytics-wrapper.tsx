'use client'

import { ReactNode } from 'react'
import { useAnalyticsIntegration } from '@/hooks/use-analytics-integration'

interface AnalyticsWrapperProps {
  children: ReactNode
  trackClick?: boolean
  clickEventName?: string
  clickContext?: Record<string, any>
  className?: string
}

// Wrapper component that automatically tracks interactions
export function AnalyticsWrapper({
  children,
  trackClick = false,
  clickEventName = 'element_clicked',
  clickContext = {},
  className,
}: AnalyticsWrapperProps) {
  const { trackEvent } = useAnalyticsIntegration()

  const handleClick = () => {
    if (trackClick) {
      trackEvent(clickEventName, {
        timestamp: new Date().toISOString(),
        ...clickContext,
      })
    }
  }

  return (
    <div 
      className={className}
      onClick={handleClick}
    >
      {children}
    </div>
  )
}

// HOC for wrapping components with analytics
export function withAnalytics<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    trackMount?: boolean
    trackUnmount?: boolean
    componentName?: string
    trackProps?: boolean
  } = {}
) {
  const {
    trackMount = false,
    trackUnmount = false,
    componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component',
    trackProps = false,
  } = options

  const AnalyticsEnhancedComponent = (props: P) => {
    const { trackEvent } = useAnalyticsIntegration()

    // Track component mount
    if (trackMount) {
      trackEvent('component_mounted', {
        componentName,
        props: trackProps ? props : undefined,
      })
    }

    // Track component unmount
    if (trackUnmount) {
      return (
        <ComponentWithUnmountTracking
          componentName={componentName}
          trackEvent={trackEvent}
        >
          <WrappedComponent {...props} />
        </ComponentWithUnmountTracking>
      )
    }

    return <WrappedComponent {...props} />
  }

  AnalyticsEnhancedComponent.displayName = `withAnalytics(${componentName})`
  
  return AnalyticsEnhancedComponent
}

// Helper component for tracking unmount
function ComponentWithUnmountTracking({
  children,
  componentName,
  trackEvent,
}: {
  children: ReactNode
  componentName: string
  trackEvent: (event: string, properties?: Record<string, any>) => void
}) {
  // Track component unmount
  const handleUnmount = () => {
    trackEvent('component_unmounted', {
      componentName,
    })
  }

  // Use effect to track unmount
  React.useEffect(() => {
    return handleUnmount
  }, [])

  return <>{children}</>
}

// Button wrapper with click tracking
interface AnalyticsButtonProps {
  children: ReactNode
  onClick?: () => void
  buttonName: string
  location?: string
  context?: Record<string, any>
  className?: string
  disabled?: boolean
}

export function AnalyticsButton({
  children,
  onClick,
  buttonName,
  location,
  context = {},
  className,
  disabled = false,
}: AnalyticsButtonProps) {
  const { trackButtonClick } = useAnalyticsIntegration()

  const handleClick = () => {
    if (!disabled) {
      trackButtonClick(buttonName, location || 'unknown', context)
      onClick?.()
    }
  }

  return (
    <button
      className={className}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

// Link wrapper with click tracking
interface AnalyticsLinkProps {
  children: ReactNode
  href: string
  linkName: string
  external?: boolean
  context?: Record<string, any>
  className?: string
}

export function AnalyticsLink({
  children,
  href,
  linkName,
  external = false,
  context = {},
  className,
}: AnalyticsLinkProps) {
  const { trackEvent } = useAnalyticsIntegration()

  const handleClick = () => {
    trackEvent('link_clicked', {
      linkName,
      href,
      external,
      ...context,
    })
  }

  if (external) {
    return (
      <a
        href={href}
        className={className}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    )
  }

  return (
    <a
      href={href}
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  )
}