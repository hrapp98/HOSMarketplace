import { NextRequest, NextResponse } from 'next/server'

// Performance monitoring interface
export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Performance metrics collection
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000

  // Record a performance metric
  record(name: string, value: number, unit: string, metadata?: Record<string, any>) {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    }

    this.metrics.push(metric)

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics)
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Performance: ${name} = ${value}${unit}`, metadata || '')
    }
  }

  // Get metrics by name
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) return [...this.metrics]
    return this.metrics.filter(m => m.name === name)
  }

  // Get average value for a metric
  getAverage(name: string): number {
    const metrics = this.getMetrics(name)
    if (metrics.length === 0) return 0
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
  }

  // Clear all metrics
  clear() {
    this.metrics = []
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Performance timing utilities
export class Timer {
  private startTime: number
  private name: string

  constructor(name: string) {
    this.name = name
    this.startTime = performance.now()
  }

  // End timer and record metric
  end(metadata?: Record<string, any>): number {
    const duration = performance.now() - this.startTime
    performanceMonitor.record(this.name, duration, 'ms', metadata)
    return duration
  }

  // Get elapsed time without ending
  elapsed(): number {
    return performance.now() - this.startTime
  }
}

// Database query performance tracking
export function trackDBQuery<T>(
  queryName: string,
  query: () => Promise<T>
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const timer = new Timer(`db_query_${queryName}`)
    
    try {
      const result = await query()
      timer.end({ queryName, success: true })
      resolve(result)
    } catch (error) {
      timer.end({ queryName, success: false, error: (error as Error).message })
      reject(error)
    }
  })
}

// API endpoint performance tracking
export function withPerformanceTracking(
  handler: (req: NextRequest) => Promise<NextResponse>,
  endpointName: string
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const timer = new Timer(`api_${endpointName}`)
    const startMemory = process.memoryUsage()
    
    try {
      const response = await handler(req)
      const duration = timer.end({
        endpoint: endpointName,
        method: req.method,
        status: response.status,
        success: response.status < 400,
      })

      // Track memory usage
      const endMemory = process.memoryUsage()
      performanceMonitor.record(
        `memory_${endpointName}`,
        endMemory.heapUsed - startMemory.heapUsed,
        'bytes',
        { endpoint: endpointName }
      )

      // Add performance headers
      response.headers.set('X-Response-Time', `${duration.toFixed(2)}ms`)
      response.headers.set('X-Memory-Usage', `${(endMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)

      return response
    } catch (error) {
      timer.end({
        endpoint: endpointName,
        method: req.method,
        success: false,
        error: (error as Error).message,
      })
      throw error
    }
  }
}

// Component performance tracking HOC
export function withComponentPerformance<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const PerformanceTrackedComponent = (props: P) => {
    const [renderTime, setRenderTime] = React.useState<number>(0)

    React.useEffect(() => {
      const startTime = performance.now()
      
      // Track mount time
      const mountTime = performance.now() - startTime
      performanceMonitor.record(`component_mount_${componentName}`, mountTime, 'ms')
      
      return () => {
        // Track unmount time
        const unmountStart = performance.now()
        performanceMonitor.record(`component_unmount_${componentName}`, performance.now() - unmountStart, 'ms')
      }
    }, [])

    // Track render time
    React.useLayoutEffect(() => {
      const renderStart = performance.now()
      setRenderTime(performance.now() - renderStart)
      performanceMonitor.record(`component_render_${componentName}`, renderTime, 'ms')
    })

    return <WrappedComponent {...props} />
  }

  PerformanceTrackedComponent.displayName = `withPerformance(${componentName})`
  return PerformanceTrackedComponent
}

// Bundle size tracking
export const bundleAnalysis = {
  // Track bundle sizes (to be used with webpack-bundle-analyzer)
  trackBundleSize: (bundleName: string, size: number) => {
    performanceMonitor.record(`bundle_size_${bundleName}`, size, 'bytes')
  },

  // Track code splitting efficiency
  trackChunkLoad: (chunkName: string, loadTime: number) => {
    performanceMonitor.record(`chunk_load_${chunkName}`, loadTime, 'ms')
  },
}

// Web Vitals tracking
export const webVitals = {
  // Track Core Web Vitals
  trackCLS: (value: number) => {
    performanceMonitor.record('web_vital_cls', value, 'score')
  },

  trackFCP: (value: number) => {
    performanceMonitor.record('web_vital_fcp', value, 'ms')
  },

  trackFID: (value: number) => {
    performanceMonitor.record('web_vital_fid', value, 'ms')
  },

  trackLCP: (value: number) => {
    performanceMonitor.record('web_vital_lcp', value, 'ms')
  },

  trackTTFB: (value: number) => {
    performanceMonitor.record('web_vital_ttfb', value, 'ms')
  },
}

// Image optimization tracking
export const imageOptimization = {
  // Track image load times
  trackImageLoad: (src: string, loadTime: number, size: number) => {
    performanceMonitor.record('image_load_time', loadTime, 'ms', { src, size })
  },

  // Track lazy loading effectiveness
  trackLazyLoad: (imageCount: number, viewportImages: number) => {
    const lazyLoadRatio = viewportImages / imageCount
    performanceMonitor.record('lazy_load_ratio', lazyLoadRatio, 'ratio', { 
      total: imageCount, 
      viewport: viewportImages 
    })
  },
}

// Memory usage monitoring
export const memoryMonitoring = {
  // Get current memory usage
  getCurrentUsage: () => {
    if (typeof window !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      }
    }
    return null
  },

  // Track memory leaks
  trackMemoryUsage: () => {
    const usage = memoryMonitoring.getCurrentUsage()
    if (usage) {
      performanceMonitor.record('memory_used', usage.used, 'bytes')
      performanceMonitor.record('memory_total', usage.total, 'bytes')
      
      // Alert if memory usage is high
      if (usage.used / usage.limit > 0.8) {
        console.warn('High memory usage detected:', usage)
      }
    }
  },
}

// Performance optimization recommendations
export const performanceOptimization = {
  // Analyze performance metrics and provide recommendations
  getRecommendations: (): string[] => {
    const recommendations: string[] = []
    
    // Check API response times
    const apiMetrics = performanceMonitor.getMetrics().filter(m => m.name.startsWith('api_'))
    const avgApiTime = apiMetrics.length > 0 
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length 
      : 0

    if (avgApiTime > 1000) {
      recommendations.push('API response times are slow (>1s). Consider implementing caching or optimizing queries.')
    }

    // Check database query times
    const dbMetrics = performanceMonitor.getMetrics().filter(m => m.name.startsWith('db_query_'))
    const avgDbTime = dbMetrics.length > 0 
      ? dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length 
      : 0

    if (avgDbTime > 500) {
      recommendations.push('Database queries are slow (>500ms). Consider adding indexes or optimizing queries.')
    }

    // Check component render times
    const renderMetrics = performanceMonitor.getMetrics().filter(m => m.name.includes('_render_'))
    const avgRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length 
      : 0

    if (avgRenderTime > 16) {
      recommendations.push('Component renders are slow (>16ms). Consider memoization or virtual scrolling.')
    }

    // Check memory usage
    const memoryMetrics = performanceMonitor.getMetrics('memory_used')
    if (memoryMetrics.length > 0) {
      const latestMemory = memoryMetrics[memoryMetrics.length - 1]
      if (latestMemory.value > 100 * 1024 * 1024) { // 100MB
        recommendations.push('High memory usage detected. Check for memory leaks or optimize data structures.')
      }
    }

    return recommendations
  },
}

// Performance reporting
export const performanceReporting = {
  // Generate performance report
  generateReport: () => {
    const metrics = performanceMonitor.getMetrics()
    const report = {
      timestamp: new Date(),
      totalMetrics: metrics.length,
      apiPerformance: {
        count: metrics.filter(m => m.name.startsWith('api_')).length,
        averageTime: performanceMonitor.getAverage('api_response_time'),
      },
      databasePerformance: {
        count: metrics.filter(m => m.name.startsWith('db_query_')).length,
        averageTime: metrics.filter(m => m.name.startsWith('db_query_')).reduce((sum, m) => sum + m.value, 0) / metrics.filter(m => m.name.startsWith('db_query_')).length || 0,
      },
      componentPerformance: {
        count: metrics.filter(m => m.name.includes('component_')).length,
        averageRenderTime: metrics.filter(m => m.name.includes('_render_')).reduce((sum, m) => sum + m.value, 0) / metrics.filter(m => m.name.includes('_render_')).length || 0,
      },
      recommendations: performanceOptimization.getRecommendations(),
    }

    return report
  },

  // Export metrics to external service
  exportMetrics: async () => {
    const report = performanceReporting.generateReport()
    
    // In production, you would send this to an external monitoring service
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to monitoring service (DataDog, New Relic, etc.)
      console.log('Performance report:', report)
    }
    
    return report
  },
}