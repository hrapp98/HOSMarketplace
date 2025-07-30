'use client'

import { useEffect } from 'react'
import { webVitals } from '@/lib/performance'

// Web Vitals monitoring component
export function WebVitalsMonitor() {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') return

    // Import web-vitals library dynamically
    import('web-vitals').then(({ getCLS, getFCP, getFID, getLCP, getTTFB }) => {
      // Track Cumulative Layout Shift
      getCLS((metric) => {
        webVitals.trackCLS(metric.value)
      })

      // Track First Contentful Paint
      getFCP((metric) => {
        webVitals.trackFCP(metric.value)
      })

      // Track First Input Delay
      getFID((metric) => {
        webVitals.trackFID(metric.value)
      })

      // Track Largest Contentful Paint
      getLCP((metric) => {
        webVitals.trackLCP(metric.value)
      })

      // Track Time to First Byte
      getTTFB((metric) => {
        webVitals.trackTTFB(metric.value)
      })
    }).catch((error) => {
      console.error('Failed to load web-vitals:', error)
    })

    // Custom performance observations
    if ('PerformanceObserver' in window) {
      // Track navigation timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            
            // Track key navigation metrics
            webVitals.trackTTFB(navEntry.responseStart - navEntry.fetchStart)
            
            // Track DOM content loaded
            if (navEntry.domContentLoadedEventEnd > 0) {
              const domContentLoaded = navEntry.domContentLoadedEventEnd - navEntry.fetchStart
              webVitals.trackFCP(domContentLoaded)
            }
          }
        })
      })

      navObserver.observe({ entryTypes: ['navigation'] })

      // Track resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            
            // Track slow resources
            if (resourceEntry.duration > 1000) {
              console.warn('Slow resource detected:', {
                name: resourceEntry.name,
                duration: resourceEntry.duration,
                size: resourceEntry.transferSize,
              })
            }
          }
        })
      })

      resourceObserver.observe({ entryTypes: ['resource'] })

      // Cleanup observers
      return () => {
        navObserver.disconnect()
        resourceObserver.disconnect()
      }
    }
  }, [])

  // Component doesn't render anything
  return null
}

// Performance monitoring dashboard component
export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch performance metrics
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/performance/metrics?type=summary')
        if (response.ok) {
          const data = await response.json()
          setMetrics(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch performance metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    
    // Refresh metrics every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-red-600">
        Failed to load performance metrics
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Performance Metrics</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">API Response</div>
          <div className="text-2xl font-bold">
            {metrics.apiPerformance.averageTime.toFixed(0)}ms
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">DB Queries</div>
          <div className="text-2xl font-bold">
            {metrics.databasePerformance.averageTime.toFixed(0)}ms
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Components</div>
          <div className="text-2xl font-bold">
            {metrics.componentPerformance.averageRenderTime.toFixed(1)}ms
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-600">Cache Health</div>
          <div className={`text-2xl font-bold ${
            metrics.cacheHealth ? 'text-green-600' : 'text-red-600'
          }`}>
            {metrics.cacheHealth ? 'Healthy' : 'Unhealthy'}
          </div>
        </div>
      </div>

      {metrics.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-800 mb-2">Performance Recommendations</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
            {metrics.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Memory usage monitor
export function MemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<any>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000)
    
    return () => clearInterval(interval)
  }, [])

  if (!memoryInfo) return null

  const usagePercentage = (memoryInfo.used / memoryInfo.limit) * 100

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h4 className="font-medium mb-2">Memory Usage</h4>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Used: {memoryInfo.used} MB</span>
          <span>Total: {memoryInfo.total} MB</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              usagePercentage > 80 ? 'bg-red-600' : 
              usagePercentage > 60 ? 'bg-yellow-600' : 'bg-green-600'
            }`}
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
        <div className="text-xs text-gray-600">
          {usagePercentage.toFixed(1)}% of {memoryInfo.limit} MB limit
        </div>
      </div>
    </div>
  )
}