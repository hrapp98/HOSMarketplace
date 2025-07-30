import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { cleanupSecurityData } from '@/lib/security-monitor'
import { withMiddleware } from '@/lib/middleware'

async function cleanupSecurity(req: NextRequest) {
  try {
    const session = await auth()
    
    // Check if user is admin
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    await cleanupSecurityData()

    return NextResponse.json({
      message: 'Security data cleanup completed successfully'
    })
  } catch (error) {
    console.error('Error during security cleanup:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply security middleware with admin-specific configuration
export const POST = withMiddleware(cleanupSecurity, {
  rateLimit: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 cleanup requests per hour
  },
  security: {
    requireAuth: true,
    validateCSRF: true,
    logRequests: true,
    checkSuspicious: true,
  },
})