// Global setup for E2E tests
import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...')
  
  // Launch browser for setup
  const browser = await chromium.launch()
  const context = await browser.newContext()
  const page = await context.newPage()

  try {
    // Wait for the app to be ready
    console.log('📡 Waiting for application to be ready...')
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check if the app is running
    const title = await page.title()
    if (!title) {
      throw new Error('Application not responding')
    }
    
    console.log(`✅ Application ready: ${title}`)

    // Seed test data if needed
    await seedTestData(page)
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    throw error
  } finally {
    await browser.close()
  }

  console.log('🎯 E2E test setup completed successfully')
}

async function seedTestData(page: any) {
  console.log('🌱 Seeding test data...')
  
  // You can add test data seeding here if needed
  // For example, creating test users, jobs, etc.
  // This would typically involve API calls or database operations
  
  console.log('✅ Test data seeded')
}

export default globalSetup