import { NextRequest, NextResponse } from 'next/server'
import { trackEvent } from '@/lib/analytics'
import { withErrorHandler, errors } from '@/lib/error-handler'

interface TrackEventRequest {
  event: string
  userId?: string
  sessionId?: string
  properties?: Record<string, any>
  timestamp?: string
  url?: string
  referer?: string
  userAgent?: string
}

async function handleTrackEvent(req: NextRequest) {
  const body: TrackEventRequest = await req.json()

  // Validate required fields
  if (!body.event) {
    throw errors.validation('Event name is required')
  }

  // Get IP address from request
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') || 
             req.ip || 
             'unknown'

  // Track the analytics event
  await trackEvent({
    event: body.event,
    userId: body.userId,
    sessionId: body.sessionId,
    properties: body.properties || {},
    timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
    ip,
    userAgent: body.userAgent || req.headers.get('user-agent') || undefined,
    referer: body.referer,
    url: body.url,
  })

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandler(handleTrackEvent, {
  operation: 'track_analytics_event',
})