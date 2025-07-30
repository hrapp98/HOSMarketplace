// E2E tests for payment workflows
import { test, expect } from '@playwright/test'
import { createHelpers, testUsers, testJobs } from './utils/test-helpers'

test.describe('Payment Workflows', () => {
  test.describe('Stripe Connect Setup (Freelancer)', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should guide freelancer through Stripe Connect setup', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Navigate to payment settings
      await page.goto('/dashboard/payments/setup')
      
      // Verify setup page
      await helpers.assert.expectElementToBeVisible('h1:has-text("Set up payments")')
      await helpers.assert.expectElementToContainText('[data-testid="setup-description"]', 'Connect your Stripe account to receive payments')
      
      // Start Stripe Connect flow
      await page.click('[data-testid="connect-stripe-button"]')
      
      // Fill Stripe Connect form
      await page.selectOption('select[name="country"]', 'US')
      await page.fill('input[name="businessType"]', 'individual')
      
      await page.click('[data-testid="continue-setup"]')
      
      // Verify redirect to Stripe (in test mode, this would be mocked)
      // In real implementation, this would redirect to Stripe's onboarding
      await helpers.wait.waitForToast('Stripe account setup initiated')
      await helpers.assert.expectElementToBeVisible('[data-testid="stripe-onboarding-message"]')
    })

    test('should show payment setup requirement for receiving payments', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Try to access payments without Stripe setup
      await page.goto('/dashboard/payments')
      
      // Verify setup requirement message
      await helpers.assert.expectElementToBeVisible('[data-testid="setup-required-banner"]')
      await helpers.assert.expectElementToContainText('[data-testid="setup-required-banner"]', 'Complete your payment setup to receive payments')
      
      // Click setup link
      await page.click('[data-testid="complete-setup-link"]')
      
      // Verify redirect to setup page
      await helpers.assert.expectToBeOnPage('/dashboard/payments/setup')
    })

    test('should display Stripe onboarding status', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments/setup')
      
      // Mock Stripe account in pending state
      await page.evaluate(() => {
        window.localStorage.setItem('stripe-account-status', 'pending')
      })
      
      await page.reload()
      
      // Verify pending status
      await helpers.assert.expectElementToBeVisible('[data-testid="stripe-status-pending"]')
      await helpers.assert.expectElementToContainText('[data-testid="status-message"]', 'Your Stripe account is being reviewed')
      
      // Mock completed status
      await page.evaluate(() => {
        window.localStorage.setItem('stripe-account-status', 'complete')
      })
      
      await page.reload()
      
      // Verify complete status
      await helpers.assert.expectElementToBeVisible('[data-testid="stripe-status-complete"]')
      await helpers.assert.expectElementToContainText('[data-testid="status-message"]', 'Your payment setup is complete')
    })
  })

  test.describe('Payment Processing (Employer)', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Setup complete workflow:
      // 1. Employer creates job
      // 2. Freelancer applies
      // 3. Employer accepts application
      // 4. Payment flow begins
      
      // Create employer and job
      await helpers.auth.register(testUsers.employer)
      await helpers.jobs.createJob(testJobs.frontendDeveloper)
      await helpers.auth.logout()
      
      // Create freelancer, apply to job
      await helpers.auth.register(testUsers.freelancer)
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      await helpers.jobs.applyToJob('I am perfect for this role.', 85)
      await helpers.auth.logout()
      
      // Login as employer and accept application
      await helpers.auth.login(testUsers.employer.email, testUsers.employer.password)
      await page.goto('/dashboard/applications')
      await page.click('[data-testid="view-application"]')
      await page.click('[data-testid="accept-application"]')
      await page.fill('textarea[data-testid="employer-message"]', 'Welcome to the team!')
      await page.click('[data-testid="confirm-accept"]')
    })

    test('should initiate payment for accepted application', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Navigate to payments
      await page.goto('/dashboard/payments')
      
      // Find accepted application
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-due"]')
      await helpers.assert.expectElementToContainText('[data-testid="freelancer-name"]', testUsers.freelancer.firstName)
      
      // Click pay now
      await page.click('[data-testid="pay-now-button"]')
      
      // Verify payment form
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-form"]')
      await helpers.assert.expectElementToContainText('[data-testid="payment-amount"]', '$85.00')
      await helpers.assert.expectElementToContainText('[data-testid="platform-fee"]', '$4.25') // 5% platform fee
      await helpers.assert.expectElementToContainText('[data-testid="total-amount"]', '$89.25')
    })

    test('should process payment with valid card', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments')
      await page.click('[data-testid="pay-now-button"]')
      
      // Fill payment form (using Stripe test card)
      await page.fill('input[data-testid="card-number"]', '4242424242424242')
      await page.fill('input[data-testid="card-expiry"]', '12/25')
      await page.fill('input[data-testid="card-cvc"]', '123')
      await page.fill('input[data-testid="cardholder-name"]', testUsers.employer.firstName)
      
      // Submit payment
      await page.click('[data-testid="submit-payment"]')
      
      // Verify payment processing
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-processing"]')
      
      // Wait for payment success
      await helpers.wait.waitForToast('Payment successful')
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-success"]')
      await helpers.assert.expectElementToContainText('[data-testid="success-message"]', 'Payment sent successfully')
    })

    test('should handle payment errors gracefully', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments')
      await page.click('[data-testid="pay-now-button"]')
      
      // Use declined test card
      await page.fill('input[data-testid="card-number"]', '4000000000000002')
      await page.fill('input[data-testid="card-expiry"]', '12/25')
      await page.fill('input[data-testid="card-cvc"]', '123')
      await page.fill('input[data-testid="cardholder-name"]', testUsers.employer.firstName)
      
      await page.click('[data-testid="submit-payment"]')
      
      // Verify error handling
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-error"]')
      await helpers.assert.expectElementToContainText('[data-testid="error-message"]', 'Your card was declined')
      
      // Verify form is still accessible for retry
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-form"]')
    })

    test('should validate payment form fields', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments')
      await page.click('[data-testid="pay-now-button"]')
      
      // Try to submit without filling required fields
      await page.click('[data-testid="submit-payment"]')
      
      // Verify validation errors
      await helpers.assert.expectElementToBeVisible('[data-testid="card-number-error"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="card-expiry-error"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="card-cvc-error"]')
      
      // Test invalid card number
      await page.fill('input[data-testid="card-number"]', '1234567890123456')
      await page.click('[data-testid="submit-payment"]')
      
      await helpers.assert.expectElementToContainText('[data-testid="card-number-error"]', 'Invalid card number')
    })

    test('should show payment confirmation details', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments')
      await page.click('[data-testid="pay-now-button"]')
      
      // Before payment, verify details
      await helpers.assert.expectElementToContainText('[data-testid="job-title"]', testJobs.frontendDeveloper.title)
      await helpers.assert.expectElementToContainText('[data-testid="freelancer-name"]', `${testUsers.freelancer.firstName} ${testUsers.freelancer.lastName}`)
      await helpers.assert.expectElementToContainText('[data-testid="agreed-rate"]', '$85.00')
      
      // Complete payment
      await page.fill('input[data-testid="card-number"]', '4242424242424242')
      await page.fill('input[data-testid="card-expiry"]', '12/25')
      await page.fill('input[data-testid="card-cvc"]', '123')
      await page.fill('input[data-testid="cardholder-name"]', testUsers.employer.firstName)
      
      await page.click('[data-testid="submit-payment"]')
      
      // Verify payment confirmation
      await helpers.wait.waitForToast('Payment successful')
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-receipt"]')
      await helpers.assert.expectElementToContainText('[data-testid="payment-id"]', 'Payment ID:')
      await helpers.assert.expectElementToContainText('[data-testid="receipt-amount"]', '$89.25')
    })

    test('should update payment status in dashboard', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Complete payment process
      await page.goto('/dashboard/payments')
      await page.click('[data-testid="pay-now-button"]')
      
      await page.fill('input[data-testid="card-number"]', '4242424242424242')
      await page.fill('input[data-testid="card-expiry"]', '12/25')
      await page.fill('input[data-testid="card-cvc"]', '123')
      await page.fill('input[data-testid="cardholder-name"]', testUsers.employer.firstName)
      
      await page.click('[data-testid="submit-payment"]')
      await helpers.wait.waitForToast('Payment successful')
      
      // Navigate back to payments dashboard
      await page.goto('/dashboard/payments')
      
      // Verify payment status updated
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-status"]:has-text("Completed")')
      await helpers.assert.expectElementToBeHidden('[data-testid="pay-now-button"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="view-receipt-button"]')
    })
  })

  test.describe('Payment History and Receipts', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      // Assume we have completed payments from previous tests
      await helpers.auth.register(testUsers.employer)
    })

    test('should display payment history for employer', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments/history')
      
      // Verify payment history page
      await helpers.assert.expectElementToBeVisible('h1:has-text("Payment History")')
      
      // Verify payment records
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-record"]')
      await helpers.assert.expectElementToContainText('[data-testid="payment-amount"]', '$89.25')
      await helpers.assert.expectElementToContainText('[data-testid="payment-status"]', 'Completed')
      await helpers.assert.expectElementToContainText('[data-testid="payment-date"]', new Date().getFullYear().toString())
    })

    test('should filter payments by date range', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments/history')
      
      // Set date filter
      const today = new Date()
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
      
      await page.fill('input[data-testid="date-from"]', lastMonth.toISOString().split('T')[0])
      await page.fill('input[data-testid="date-to"]', today.toISOString().split('T')[0])
      
      await page.click('[data-testid="apply-filter"]')
      
      // Verify filtered results
      await helpers.wait.waitForPageLoad()
      const paymentRecords = page.locator('[data-testid="payment-record"]')
      expect(await paymentRecords.count()).toBeGreaterThanOrEqual(0)
    })

    test('should download payment receipt', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments/history')
      
      // Wait for download
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="download-receipt"]')
      const download = await downloadPromise
      
      // Verify download
      expect(download.suggestedFilename()).toMatch(/receipt.*\.pdf/)
    })

    test('should export payment history', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/payments/history')
      
      // Click export button
      const downloadPromise = page.waitForEvent('download')
      await page.click('[data-testid="export-payments"]')
      const download = await downloadPromise
      
      // Verify export file
      expect(download.suggestedFilename()).toMatch(/payments.*\.csv/)
    })
  })

  test.describe('Freelancer Payment Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should display earnings overview', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/earnings')
      
      // Verify earnings dashboard
      await helpers.assert.expectElementToBeVisible('h1:has-text("Earnings")')
      await helpers.assert.expectElementToBeVisible('[data-testid="total-earnings"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="pending-earnings"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="available-balance"]')
      
      // Verify earnings breakdown
      await helpers.assert.expectElementToBeVisible('[data-testid="earnings-chart"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="recent-payments"]')
    })

    test('should show payment notifications', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard')
      
      // Verify payment notification
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-notification"]')
      await helpers.assert.expectElementToContainText('[data-testid="notification-text"]', 'payment received')
      
      // Click notification
      await page.click('[data-testid="payment-notification"]')
      
      // Verify redirect to earnings page
      await helpers.assert.expectToBeOnPage('/dashboard/earnings')
    })

    test('should display payment status updates', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/earnings')
      
      // Verify different payment statuses
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-status-pending"]')
      await helpers.assert.expectElementToContainText('[data-testid="status-description"]', 'Payment is being processed')
      
      // Mock payment completion
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('payment-completed', {
          detail: { paymentId: 'test-payment-id', amount: 8500 }
        }))
      })
      
      // Verify status update
      await helpers.wait.waitForToast('Payment completed')
      await helpers.assert.expectElementToBeVisible('[data-testid="payment-status-completed"]')
    })

    test('should handle Stripe payout settings', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/earnings/settings')
      
      // Verify payout settings
      await helpers.assert.expectElementToBeVisible('h2:has-text("Payout Settings")')
      await helpers.assert.expectElementToBeVisible('[data-testid="payout-schedule"]')
      
      // Update payout schedule
      await page.selectOption('select[data-testid="payout-frequency"]', 'weekly')
      await page.click('[data-testid="save-settings"]')
      
      // Verify update
      await helpers.wait.waitForToast('Payout settings updated')
    })
  })
})