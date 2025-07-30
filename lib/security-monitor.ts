import { NextRequest } from 'next/server'
import { Redis } from 'ioredis'

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

export interface SecurityAlert {
  id: string
  timestamp: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  type: string
  ip: string
  userAgent: string
  userId?: string
  details: Record<string, any>
}

export interface SecurityMetrics {
  totalRequests: number
  blockedRequests: number
  rateLimitedRequests: number
  suspiciousActivity: number
  authFailures: number
  lastUpdated: Date
}

// Security event types
export const SECURITY_EVENTS = {
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  AUTH_FAILURE: 'auth_failure',
  BRUTE_FORCE_ATTEMPT: 'brute_force_attempt',
  SQL_INJECTION_ATTEMPT: 'sql_injection_attempt',
  XSS_ATTEMPT: 'xss_attempt',
  CSRF_FAILURE: 'csrf_failure',
  INVALID_TOKEN: 'invalid_token',
  PERMISSION_DENIED: 'permission_denied',
  MALICIOUS_FILE_UPLOAD: 'malicious_file_upload',
} as const

// Generate unique alert ID
function generateAlertId(): string {
  return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Record security alert
export async function recordSecurityAlert(
  req: NextRequest,
  type: string,
  severity: SecurityAlert['severity'],
  details: Record<string, any> = {}
): Promise<void> {
  const alert: SecurityAlert = {
    id: generateAlertId(),
    timestamp: new Date(),
    severity,
    type,
    ip: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    details: {
      url: req.url,
      method: req.method,
      ...details,
    },
  }

  try {
    // Store alert in Redis with expiration (30 days)
    await redis.setex(
      `security:alert:${alert.id}`,
      30 * 24 * 60 * 60,
      JSON.stringify(alert)
    )

    // Add to severity-specific list
    await redis.lpush(`security:alerts:${severity}`, alert.id)
    await redis.ltrim(`security:alerts:${severity}`, 0, 999) // Keep last 1000 alerts

    // Add to general alerts list
    await redis.lpush('security:alerts:all', alert.id)
    await redis.ltrim('security:alerts:all', 0, 9999) // Keep last 10000 alerts

    // Update metrics
    await updateSecurityMetrics(type)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 Security Alert:', alert)
    }

    // In production, you might want to send to external monitoring service
    if (process.env.NODE_ENV === 'production' && severity === 'critical') {
      // TODO: Send to external alerting system (Slack, PagerDuty, etc.)
      console.error('CRITICAL SECURITY ALERT:', JSON.stringify(alert))
    }
  } catch (error) {
    console.error('Error recording security alert:', error)
  }
}

// Update security metrics
async function updateSecurityMetrics(eventType: string): Promise<void> {
  try {
    const metricsKey = 'security:metrics'
    const current = await redis.get(metricsKey)
    
    let metrics: SecurityMetrics = current
      ? JSON.parse(current)
      : {
          totalRequests: 0,
          blockedRequests: 0,
          rateLimitedRequests: 0,
          suspiciousActivity: 0,
          authFailures: 0,
          lastUpdated: new Date(),
        }

    // Update counters based on event type
    switch (eventType) {
      case SECURITY_EVENTS.RATE_LIMIT_EXCEEDED:
        metrics.rateLimitedRequests++
        metrics.blockedRequests++
        break
      case SECURITY_EVENTS.SUSPICIOUS_ACTIVITY:
      case SECURITY_EVENTS.SQL_INJECTION_ATTEMPT:
      case SECURITY_EVENTS.XSS_ATTEMPT:
        metrics.suspiciousActivity++
        metrics.blockedRequests++
        break
      case SECURITY_EVENTS.AUTH_FAILURE:
      case SECURITY_EVENTS.BRUTE_FORCE_ATTEMPT:
      case SECURITY_EVENTS.INVALID_TOKEN:
        metrics.authFailures++
        break
      default:
        metrics.blockedRequests++
    }

    metrics.totalRequests++
    metrics.lastUpdated = new Date()

    // Store updated metrics
    await redis.setex(metricsKey, 24 * 60 * 60, JSON.stringify(metrics)) // 24 hour expiration
  } catch (error) {
    console.error('Error updating security metrics:', error)
  }
}

// Get security metrics
export async function getSecurityMetrics(): Promise<SecurityMetrics | null> {
  try {
    const metrics = await redis.get('security:metrics')
    return metrics ? JSON.parse(metrics) : null
  } catch (error) {
    console.error('Error getting security metrics:', error)
    return null
  }
}

// Get recent security alerts
export async function getRecentAlerts(
  severity?: SecurityAlert['severity'],
  limit: number = 100
): Promise<SecurityAlert[]> {
  try {
    const listKey = severity ? `security:alerts:${severity}` : 'security:alerts:all'
    const alertIds = await redis.lrange(listKey, 0, limit - 1)
    
    if (alertIds.length === 0) return []

    const alerts: SecurityAlert[] = []
    
    for (const id of alertIds) {
      const alertData = await redis.get(`security:alert:${id}`)
      if (alertData) {
        alerts.push(JSON.parse(alertData))
      }
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  } catch (error) {
    console.error('Error getting recent alerts:', error)
    return []
  }
}

// Check for brute force attacks
export async function checkBruteForce(
  ip: string,
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<{ isBlocked: boolean; attempts: number; resetTime?: Date }> {
  try {
    const key = `brute_force:${ip}:${identifier}`
    const attempts = await redis.get(key)
    const currentAttempts = attempts ? parseInt(attempts) : 0

    if (currentAttempts >= maxAttempts) {
      const ttl = await redis.ttl(key)
      return {
        isBlocked: true,
        attempts: currentAttempts,
        resetTime: new Date(Date.now() + ttl * 1000),
      }
    }

    return { isBlocked: false, attempts: currentAttempts }
  } catch (error) {
    console.error('Error checking brute force:', error)
    return { isBlocked: false, attempts: 0 }
  }
}

// Record failed attempt
export async function recordFailedAttempt(
  ip: string,
  identifier: string,
  windowMinutes: number = 15
): Promise<void> {
  try {
    const key = `brute_force:${ip}:${identifier}`
    const ttl = windowMinutes * 60

    await redis.multi()
      .incr(key)
      .expire(key, ttl)
      .exec()
  } catch (error) {
    console.error('Error recording failed attempt:', error)
  }
}

// Clean up old security data
export async function cleanupSecurityData(): Promise<void> {
  try {
    // Remove expired alert IDs from lists
    const allAlerts = await redis.lrange('security:alerts:all', 0, -1)
    
    for (const alertId of allAlerts) {
      const exists = await redis.exists(`security:alert:${alertId}`)
      if (!exists) {
        // Remove from all lists
        await redis.lrem('security:alerts:all', 1, alertId)
        await redis.lrem('security:alerts:low', 1, alertId)
        await redis.lrem('security:alerts:medium', 1, alertId)
        await redis.lrem('security:alerts:high', 1, alertId)
        await redis.lrem('security:alerts:critical', 1, alertId)
      }
    }

    console.log('Security data cleanup completed')
  } catch (error) {
    console.error('Error cleaning up security data:', error)
  }
}

// Get IP reputation (simple implementation)
export async function getIPReputation(ip: string): Promise<{
  reputation: 'good' | 'suspicious' | 'bad'
  score: number
  reasons: string[]
}> {
  try {
    const key = `ip_reputation:${ip}`
    const data = await redis.get(key)
    
    if (data) {
      return JSON.parse(data)
    }

    // Default reputation for new IPs
    const reputation = {
      reputation: 'good' as const,
      score: 100,
      reasons: [],
    }

    // Cache for 1 hour
    await redis.setex(key, 60 * 60, JSON.stringify(reputation))
    
    return reputation
  } catch (error) {
    console.error('Error getting IP reputation:', error)
    return { reputation: 'good', score: 100, reasons: [] }
  }
}

// Update IP reputation based on security events
export async function updateIPReputation(
  ip: string,
  event: string,
  severity: SecurityAlert['severity']
): Promise<void> {
  try {
    const reputation = await getIPReputation(ip)
    
    // Reduce score based on event severity
    let scoreReduction = 0
    switch (severity) {
      case 'low':
        scoreReduction = 5
        break
      case 'medium':
        scoreReduction = 15
        break
      case 'high':
        scoreReduction = 30
        break
      case 'critical':
        scoreReduction = 50
        break
    }

    reputation.score = Math.max(0, reputation.score - scoreReduction)
    reputation.reasons.push(`${event} (${severity})`)
    
    // Keep only last 10 reasons
    reputation.reasons = reputation.reasons.slice(-10)
    
    // Update reputation level
    if (reputation.score >= 80) {
      reputation.reputation = 'good'
    } else if (reputation.score >= 40) {
      reputation.reputation = 'suspicious'
    } else {
      reputation.reputation = 'bad'
    }

    const key = `ip_reputation:${ip}`
    await redis.setex(key, 24 * 60 * 60, JSON.stringify(reputation)) // 24 hour expiration
  } catch (error) {
    console.error('Error updating IP reputation:', error)
  }
}