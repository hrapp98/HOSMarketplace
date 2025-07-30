// Global teardown for E2E tests
import { FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test teardown...')
  
  try {
    // Clean up test data if needed
    await cleanupTestData()
    
    console.log('✅ E2E test teardown completed')
  } catch (error) {
    console.error('❌ Global teardown failed:', error)
    // Don't throw here as it might mask test failures
  }
}

async function cleanupTestData() {
  console.log('🗑️ Cleaning up test data...')
  
  // Add cleanup logic here if needed
  // For example, removing test users, jobs, etc.
  
  console.log('✅ Test data cleaned up')
}

export default globalTeardown