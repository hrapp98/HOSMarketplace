import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { performanceMonitor, performanceReporting } from '@/lib/performance'
import { cacheMonitoring } from '@/lib/cache'
import { connectionPool } from '@/lib/db-optimization'
import { withErrorHandler, errors } from '@/lib/error-handler'

interface PerformanceMetricsRequest {
  type?: 'summary' | 'detailed' | 'cache' | 'database'
  timeRange?: 'hour' | 'day' | 'week'
}

async function getPerformanceMetrics(req: NextRequest) {
  const session = await auth()
  
  // Check if user is admin
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw errors.forbidden('Admin access required')
  }

  const url = new URL(req.url)
  const type = url.searchParams.get('type') as PerformanceMetricsRequest['type'] || 'summary'
  const timeRange = url.searchParams.get('timeRange') as PerformanceMetricsRequest['timeRange'] || 'hour'

  try {
    switch (type) {
      case 'summary':
        const report = performanceReporting.generateReport()
        return NextResponse.json({
          success: true,
          data: {
            ...report,
            cacheHealth: await cacheMonitoring.healthCheck(),
            dbConnectionPool: await connectionPool.getStatus(),
          }
        })

      case 'detailed':
        const detailedMetrics = performanceMonitor.getMetrics()
        const now = new Date()
        const timeRangeMs = {
          hour: 60 * 60 * 1000,
          day: 24 * 60 * 60 * 1000,
          week: 7 * 24 * 60 * 60 * 1000,
        }[timeRange]

        const filteredMetrics = detailedMetrics.filter(
          metric => now.getTime() - metric.timestamp.getTime() <= timeRangeMs
        )

        return NextResponse.json({
          success: true,
          data: {
            totalMetrics: filteredMetrics.length,
            timeRange,
            metrics: filteredMetrics,
            averages: {
              apiResponseTime: performanceMonitor.getAverage('api_response_time'),
              dbQueryTime: filteredMetrics
                .filter(m => m.name.startsWith('db_query_'))
                .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0),
              componentRenderTime: filteredMetrics
                .filter(m => m.name.includes('_render_'))
                .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0),
            },
          }
        })

      case 'cache':
        const cacheStats = await cacheMonitoring.getStats()
        const cacheHealth = await cacheMonitoring.healthCheck()
        
        return NextResponse.json({
          success: true,
          data: {
            stats: cacheStats,
            health: cacheHealth,
            metrics: performanceMonitor.getMetrics().filter(m => 
              m.name.includes('cache') || m.name.includes('memory')
            ),
          }
        })

      case 'database':
        const dbHealth = await (await import('@/lib/db-optimization')).DBOptimizer.healthCheck()
        const dbMetrics = performanceMonitor.getMetrics().filter(m => 
          m.name.startsWith('db_query_') || m.name.includes('database')
        )
        
        return NextResponse.json({
          success: true,
          data: {
            health: dbHealth,
            connectionPool: await connectionPool.getStatus(),
            metrics: dbMetrics,
            averageQueryTime: dbMetrics.reduce((sum, m, _, arr) => sum + m.value / arr.length, 0),
            slowQueries: dbMetrics
              .filter(m => m.value > 1000) // Queries slower than 1 second
              .sort((a, b) => b.value - a.value)
              .slice(0, 10),
          }
        })

      default:
        throw errors.validation('Invalid metrics type')
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    throw errors.internal('Failed to fetch performance metrics')
  }
}

// Clear performance metrics (admin only)
async function clearPerformanceMetrics(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw errors.forbidden('Admin access required')
  }

  performanceMonitor.clear()
  
  return NextResponse.json({
    success: true,
    message: 'Performance metrics cleared'
  })
}

export const GET = withErrorHandler(getPerformanceMetrics, {
  operation: 'get_performance_metrics',
})

export const DELETE = withErrorHandler(clearPerformanceMetrics, {
  operation: 'clear_performance_metrics',
})