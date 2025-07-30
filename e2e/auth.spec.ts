// E2E tests for authentication workflows
import { test, expect } from '@playwright/test'
import { createHelpers, testUsers } from './utils/test-helpers'

test.describe('Authentication Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure we're logged out before each test
    await page.goto('/')
    const helpers = createHelpers(page)
    
    if (await helpers.auth.isLoggedIn()) {
      await helpers.auth.logout()
    }
  })

  test('should register a new freelancer successfully', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // Go to register page
    await helpers.nav.goToRegisterPage()
    
    // Verify we're on the register page
    await helpers.assert.expectToBeOnPage('/auth/register')
    await helpers.assert.expectElementToBeVisible('h1:has-text("Create Account")')
    
    // Fill registration form
    await page.fill('input[name="email"]', testUsers.freelancer.email)
    await page.fill('input[name="password"]', testUsers.freelancer.password)
    await page.selectOption('select[name="role"]', testUsers.freelancer.role)
    await page.fill('input[name="firstName"]', testUsers.freelancer.firstName)
    await page.fill('input[name="lastName"]', testUsers.freelancer.lastName)
    await page.selectOption('select[name="country"]', testUsers.freelancer.country)
    
    // Submit registration
    await page.click('button[type="submit"]')
    
    // Verify successful registration and redirect to dashboard
    await helpers.assert.expectToBeOnPage('/dashboard')
    await helpers.assert.expectElementToBeVisible('[data-testid="welcome-message"]')
    await helpers.assert.expectElementToContainText('[data-testid="user-name"]', testUsers.freelancer.firstName)
  })

  test('should register a new employer successfully', async ({ page }) => {
    const helpers = createHelpers(page)
    
    await helpers.nav.goToRegisterPage()
    
    // Fill employer registration form
    await page.fill('input[name="email"]', testUsers.employer.email)
    await page.fill('input[name="password"]', testUsers.employer.password)
    await page.selectOption('select[name="role"]', testUsers.employer.role)
    await page.fill('input[name="firstName"]', testUsers.employer.firstName)
    await page.fill('input[name="lastName"]', testUsers.employer.lastName)
    await page.fill('input[name="companyName"]', testUsers.employer.companyName)
    
    await page.click('button[type="submit"]')
    
    // Verify successful registration
    await helpers.assert.expectToBeOnPage('/dashboard')
    await helpers.assert.expectElementToContainText('[data-testid="company-name"]', testUsers.employer.companyName)
  })

  test('should show validation errors for invalid registration data', async ({ page }) => {
    const helpers = createHelpers(page)
    
    await helpers.nav.goToRegisterPage()
    
    // Try to submit with invalid data
    await page.fill('input[name="email"]', 'invalid-email')
    await page.fill('input[name="password"]', '123') // Too short
    await page.click('button[type="submit"]')
    
    // Verify validation errors are shown
    await helpers.assert.expectElementToBeVisible('[data-testid="email-error"]')
    await helpers.assert.expectElementToBeVisible('[data-testid="password-error"]')
    await helpers.assert.expectElementToContainText('[data-testid="email-error"]', 'Invalid email')
    await helpers.assert.expectElementToContainText('[data-testid="password-error"]', 'Password must be at least')
  })

  test('should prevent registration with existing email', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // First, register a user
    await helpers.auth.register(testUsers.freelancer)
    await helpers.auth.logout()
    
    // Try to register again with the same email
    await helpers.nav.goToRegisterPage()
    await page.fill('input[name="email"]', testUsers.freelancer.email)
    await page.fill('input[name="password"]', testUsers.freelancer.password)
    await page.selectOption('select[name="role"]', testUsers.freelancer.role)
    await page.fill('input[name="firstName"]', testUsers.freelancer.firstName)
    await page.fill('input[name="lastName"]', testUsers.freelancer.lastName)
    await page.selectOption('select[name="country"]', testUsers.freelancer.country)
    
    await page.click('button[type="submit"]')
    
    // Verify error message
    await helpers.assert.expectElementToBeVisible('[data-testid="form-error"]')
    await helpers.assert.expectElementToContainText('[data-testid="form-error"]', 'already exists')
  })

  test('should login with valid credentials', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // First register a user
    await helpers.auth.register(testUsers.freelancer)
    await helpers.auth.logout()
    
    // Now login
    await helpers.nav.goToLoginPage()
    await page.fill('input[name="email"]', testUsers.freelancer.email)
    await page.fill('input[name="password"]', testUsers.freelancer.password)
    await page.click('button[type="submit"]')
    
    // Verify successful login
    await helpers.assert.expectToBeOnPage('/dashboard')
    await helpers.assert.expectElementToBeVisible('[data-testid="user-menu"]')
  })

  test('should show error for invalid login credentials', async ({ page }) => {
    const helpers = createHelpers(page)
    
    await helpers.nav.goToLoginPage()
    await page.fill('input[name="email"]', 'nonexistent@example.com')
    await page.fill('input[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Verify error message
    await helpers.assert.expectElementToBeVisible('[data-testid="login-error"]')
    await helpers.assert.expectElementToContainText('[data-testid="login-error"]', 'Invalid credentials')
  })

  test('should logout successfully', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // Register and login
    await helpers.auth.register(testUsers.freelancer)
    
    // Logout
    await helpers.auth.logout()
    
    // Verify we're logged out
    await helpers.assert.expectToBeOnPage('/')
    await helpers.assert.expectElementToBeHidden('[data-testid="user-menu"]')
    await helpers.assert.expectElementToBeVisible('[data-testid="signin-button"]')
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // Try to access dashboard without being logged in
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await helpers.assert.expectToBeOnPage('/auth/signin')
    await helpers.assert.expectElementToBeVisible('h1:has-text("Sign In")')
  })

  test('should preserve intended destination after login', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // Register a user first
    await helpers.auth.register(testUsers.freelancer)
    await helpers.auth.logout()
    
    // Try to access a protected route
    await page.goto('/profile')
    
    // Should be redirected to login with return URL
    await helpers.assert.expectToBeOnPage('/auth/signin')
    
    // Login
    await page.fill('input[name="email"]', testUsers.freelancer.email)
    await page.fill('input[name="password"]', testUsers.freelancer.password)
    await page.click('button[type="submit"]')
    
    // Should be redirected to originally requested page
    await helpers.assert.expectToBeOnPage('/profile')
  })

  test('should show loading state during authentication', async ({ page }) => {
    const helpers = createHelpers(page)
    
    await helpers.nav.goToLoginPage()
    
    // Fill credentials
    await page.fill('input[name="email"]', testUsers.freelancer.email)
    await page.fill('input[name="password"]', testUsers.freelancer.password)
    
    // Click submit and immediately check for loading state
    await page.click('button[type="submit"]')
    await helpers.assert.expectElementToBeVisible('[data-testid="login-loading"]')
  })

  test('should validate password strength in real-time', async ({ page }) => {
    const helpers = createHelpers(page)
    
    await helpers.nav.goToRegisterPage()
    
    const passwordInput = page.locator('input[name="password"]')
    const strengthIndicator = page.locator('[data-testid="password-strength"]')
    
    // Test weak password
    await passwordInput.fill('123')
    await helpers.assert.expectElementToContainText('[data-testid="password-strength"]', 'Weak')
    
    // Test medium password
    await passwordInput.fill('password123')
    await helpers.assert.expectElementToContainText('[data-testid="password-strength"]', 'Medium')
    
    // Test strong password
    await passwordInput.fill('SecureP@ss123!')
    await helpers.assert.expectElementToContainText('[data-testid="password-strength"]', 'Strong')
  })

  test('should handle session timeout gracefully', async ({ page }) => {
    const helpers = createHelpers(page)
    
    // Register and login
    await helpers.auth.register(testUsers.freelancer)
    
    // Simulate session expiry by manipulating storage
    await page.evaluate(() => {
      localStorage.removeItem('next-auth.session-token')
      sessionStorage.clear()
    })
    
    // Try to access a protected resource
    await page.goto('/dashboard/settings')
    
    // Should be redirected to login
    await helpers.assert.expectToBeOnPage('/auth/signin')
    await helpers.assert.expectElementToBeVisible('[data-testid="session-expired-message"]')
  })
})