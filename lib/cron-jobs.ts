import { cleanupSecurityData } from './security-monitor'

// Scheduled security cleanup job
export async function runSecurityCleanup() {
  try {
    console.log('🧹 Running scheduled security data cleanup...')
    await cleanupSecurityData()
    console.log('✅ Scheduled security cleanup completed')
  } catch (error) {
    console.error('❌ Scheduled security cleanup failed:', error)
  }
}

// Schedule security cleanup to run every 6 hours
export function scheduleSecurityCleanup() {
  const CLEANUP_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours in milliseconds
  
  // Run immediately on startup
  runSecurityCleanup()
  
  // Schedule recurring cleanup
  setInterval(runSecurityCleanup, CLEANUP_INTERVAL)
  
  console.log('⏰ Security cleanup scheduled to run every 6 hours')
}

// Initialize all scheduled jobs
export function initializeScheduledJobs() {
  if (process.env.NODE_ENV === 'production') {
    scheduleSecurityCleanup()
  } else {
    console.log('🔧 Skipping scheduled jobs in development mode')
  }
}