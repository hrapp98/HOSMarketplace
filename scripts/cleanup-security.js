const { Redis } = require('ioredis')

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')

async function cleanupSecurityData() {
  try {
    console.log('🧹 Starting security data cleanup...')
    
    // Get all alert IDs from the main list
    const allAlerts = await redis.lrange('security:alerts:all', 0, -1)
    let cleanedCount = 0
    
    console.log(`📊 Found ${allAlerts.length} alert references to check`)
    
    for (const alertId of allAlerts) {
      const exists = await redis.exists(`security:alert:${alertId}`)
      if (!exists) {
        // Remove from all lists
        await Promise.all([
          redis.lrem('security:alerts:all', 1, alertId),
          redis.lrem('security:alerts:low', 1, alertId),
          redis.lrem('security:alerts:medium', 1, alertId),
          redis.lrem('security:alerts:high', 1, alertId),
          redis.lrem('security:alerts:critical', 1, alertId),
        ])
        cleanedCount++
      }
    }
    
    // Clean up old brute force tracking keys
    const bruteForceKeys = await redis.keys('brute_force:*')
    let expiredBruteForce = 0
    
    for (const key of bruteForceKeys) {
      const ttl = await redis.ttl(key)
      if (ttl === -1) {
        // Key exists but has no expiration, set one (15 minutes default)
        await redis.expire(key, 15 * 60)
      } else if (ttl === -2) {
        // Key doesn't exist (already expired)
        expiredBruteForce++
      }
    }
    
    // Clean up old IP reputation keys
    const ipReputationKeys = await redis.keys('ip_reputation:*')
    let expiredReputations = 0
    
    for (const key of ipReputationKeys) {
      const ttl = await redis.ttl(key)
      if (ttl === -1) {
        // Key exists but has no expiration, set one (24 hours)
        await redis.expire(key, 24 * 60 * 60)
      } else if (ttl === -2) {
        expiredReputations++
      }
    }
    
    console.log(`✅ Security data cleanup completed:`)
    console.log(`   • Cleaned ${cleanedCount} expired alert references`)
    console.log(`   • Found ${bruteForceKeys.length} brute force tracking keys`)
    console.log(`   • Found ${ipReputationKeys.length} IP reputation keys`)
    
    // Get current metrics
    const metrics = await redis.get('security:metrics')
    if (metrics) {
      const parsedMetrics = JSON.parse(metrics)
      console.log(`📈 Current security metrics:`)
      console.log(`   • Total requests: ${parsedMetrics.totalRequests}`)
      console.log(`   • Blocked requests: ${parsedMetrics.blockedRequests}`)
      console.log(`   • Rate limited: ${parsedMetrics.rateLimitedRequests}`)
      console.log(`   • Suspicious activity: ${parsedMetrics.suspiciousActivity}`)
      console.log(`   • Auth failures: ${parsedMetrics.authFailures}`)
    }
    
  } catch (error) {
    console.error('❌ Error during security cleanup:', error)
  } finally {
    await redis.disconnect()
  }
}

// Run the cleanup
cleanupSecurityData()