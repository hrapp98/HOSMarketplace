import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { getSecurityMetrics, getRecentAlerts } from '@/lib/security-monitor'
import { withMiddleware } from '@/lib/middleware'

async function getSecurityData(req: NextRequest) {
  try {
    const session = await auth()
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const url = new URL(req.url)
    const severity = url.searchParams.get('severity')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Get security metrics and recent alerts
    const [metrics, alerts] = await Promise.all([
      getSecurityMetrics(),
      getRecentAlerts(severity as any, limit)
    ])

    return NextResponse.json({
      metrics,
      alerts,
      summary: {
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        highAlerts: alerts.filter(a => a.severity === 'high').length,
        mediumAlerts: alerts.filter(a => a.severity === 'medium').length,
        lowAlerts: alerts.filter(a => a.severity === 'low').length,
      }
    })
  } catch (error) {
    console.error('Error fetching security data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply security middleware with admin-specific configuration
export const GET = withMiddleware(getSecurityData, {
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute for admin endpoints
  },
  security: {
    requireAuth: true,
    validateCSRF: false,
    logRequests: true,
    checkSuspicious: true,
  },
})