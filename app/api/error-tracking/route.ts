import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandler, errors } from '@/lib/error-handler'

// Error tracking endpoint for client-side errors
async function handleErrorTracking(req: NextRequest) {
  const body = await req.json()
  
  // Validate required fields
  if (!body.type || !body.message) {
    throw errors.validation('Missing required fields: type and message')
  }

  // Log the client-side error
  const errorData = {
    type: body.type,
    message: body.message,
    stack: body.stack,
    digest: body.digest,
    url: body.url,
    userAgent: body.userAgent,
    timestamp: body.timestamp || new Date().toISOString(),
    userId: body.userId,
    sessionId: body.sessionId,
    additionalData: body.additionalData,
  }

  // Log based on error type
  switch (body.type) {
    case 'GLOBAL_ERROR':
      console.error('🚨 CRITICAL CLIENT ERROR:', errorData)
      break
    case 'COMPONENT_ERROR':
      console.warn('⚠️ CLIENT COMPONENT ERROR:', errorData)
      break
    case 'API_ERROR':
      console.warn('⚠️ CLIENT API ERROR:', errorData)
      break
    default:
      console.info('ℹ️ CLIENT ERROR:', errorData)
  }

  // In production, you would send this to an external service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Send to external error tracking service
    // Examples: Sentry, LogRocket, DataDog, Bugsnag, etc.
    /*
    await sendToSentry(errorData)
    await sendToLogRocket(errorData)
    await sendToDataDog(errorData)
    */
  }

  return NextResponse.json({ 
    success: true, 
    message: 'Error tracked successfully' 
  })
}

export const POST = withErrorHandler(handleErrorTracking, {
  operation: 'track_client_error',
})