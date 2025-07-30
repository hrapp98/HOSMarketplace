// E2E tests for profile management workflows
import { test, expect } from '@playwright/test'
import { createHelpers, testUsers } from './utils/test-helpers'
import path from 'path'

test.describe('Profile Management Workflows', () => {
  test.describe('Freelancer Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should complete freelancer profile setup', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Navigate to profile completion
      await page.goto('/profile/complete')
      
      // Verify profile completion page
      await helpers.assert.expectElementToBeVisible('h1:has-text("Complete Your Profile")')
      await helpers.assert.expectElementToBeVisible('[data-testid="profile-progress"]')
      
      // Fill professional information
      await page.fill('input[name="title"]', 'Senior Frontend Developer')
      await page.fill('textarea[name="bio"]', 'I am a passionate frontend developer with 5+ years of experience building modern web applications using React, TypeScript, and Next.js. I love creating user-friendly interfaces and solving complex problems.')
      await page.fill('input[name="hourlyRate"]', '85')
      
      // Add skills
      const skills = ['React', 'TypeScript', 'Next.js', 'JavaScript', 'CSS', 'HTML']
      for (const skill of skills) {
        await page.fill('input[data-testid="skill-input"]', skill)
        await page.press('input[data-testid="skill-input"]', 'Enter')
        await helpers.assert.expectElementToBeVisible(`[data-testid="skill-tag"]:has-text("${skill}")`)
      }
      
      // Add experience
      await page.click('[data-testid="add-experience"]')
      await page.fill('input[name="experience.0.company"]', 'Tech Corp')
      await page.fill('input[name="experience.0.position"]', 'Frontend Developer')
      await page.fill('input[name="experience.0.startDate"]', '2020-01')
      await page.fill('input[name="experience.0.endDate"]', '2023-12')
      await page.fill('textarea[name="experience.0.description"]', 'Developed and maintained multiple React applications serving 100k+ users.')
      
      // Add education
      await page.click('[data-testid="add-education"]')
      await page.fill('input[name="education.0.institution"]', 'University of Technology')
      await page.fill('input[name="education.0.degree"]', 'Bachelor of Computer Science')
      await page.fill('input[name="education.0.graduationYear"]', '2019')
      
      // Set availability
      await page.selectOption('select[name="availability"]', 'FULL_TIME')
      
      // Submit profile
      await page.click('[data-testid="save-profile"]')
      
      // Verify success
      await helpers.wait.waitForToast('Profile updated successfully')
      await helpers.assert.expectToBeOnPage('/profile')
      await helpers.assert.expectElementToContainText('[data-testid="profile-title"]', 'Senior Frontend Developer')
    })

    test('should upload and manage profile avatar', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/edit')
      
      // Create a test image file
      const testImagePath = path.join(__dirname, 'fixtures', 'test-avatar.jpg')
      
      // Upload avatar
      await page.setInputFiles('input[data-testid="avatar-upload"]', testImagePath)
      
      // Verify upload preview
      await helpers.assert.expectElementToBeVisible('[data-testid="avatar-preview"]')
      
      // Save profile with new avatar
      await page.click('[data-testid="save-profile"]')
      
      // Verify avatar is displayed
      await helpers.wait.waitForToast('Profile updated successfully')
      await helpers.assert.expectElementToBeVisible('[data-testid="profile-avatar"]')
    })

    test('should manage portfolio items', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/portfolio')
      
      // Add portfolio item
      await page.click('[data-testid="add-portfolio-item"]')
      
      // Fill portfolio details
      await page.fill('input[name="title"]', 'E-commerce React Application')
      await page.fill('textarea[name="description"]', 'A full-featured e-commerce application built with React, Redux, and Node.js. Features include user authentication, product catalog, shopping cart, and payment processing.')
      await page.fill('input[name="url"]', 'https://example-ecommerce.com')
      await page.fill('input[name="githubUrl"]', 'https://github.com/user/ecommerce-app')
      
      // Add technologies
      const technologies = ['React', 'Redux', 'Node.js', 'Express', 'MongoDB']
      for (const tech of technologies) {
        await page.fill('input[data-testid="tech-input"]', tech)
        await page.press('input[data-testid="tech-input"]', 'Enter')
      }
      
      // Upload project images
      const testImagePath = path.join(__dirname, 'fixtures', 'project-screenshot.jpg')
      await page.setInputFiles('input[data-testid="portfolio-images"]', testImagePath)
      
      // Save portfolio item
      await page.click('[data-testid="save-portfolio-item"]')
      
      // Verify portfolio item is added
      await helpers.wait.waitForToast('Portfolio item added')
      await helpers.assert.expectElementToBeVisible('[data-testid="portfolio-item"]')
      await helpers.assert.expectElementToContainText('[data-testid="portfolio-title"]', 'E-commerce React Application')
    })

    test('should update availability and rates', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/availability')
      
      // Update availability status
      await page.selectOption('select[data-testid="availability-status"]', 'AVAILABLE')
      
      // Update hourly rate
      await page.fill('input[data-testid="hourly-rate"]', '95')
      
      // Set availability hours
      await page.check('input[data-testid="monday"]')
      await page.check('input[data-testid="tuesday"]')
      await page.check('input[data-testid="wednesday"]')
      await page.check('input[data-testid="thursday"]')
      await page.check('input[data-testid="friday"]')
      
      await page.selectOption('select[data-testid="start-time"]', '09:00')
      await page.selectOption('select[data-testid="end-time"]', '17:00')
      
      // Set timezone
      await page.selectOption('select[data-testid="timezone"]', 'America/New_York')
      
      // Save availability
      await page.click('[data-testid="save-availability"]')
      
      // Verify update
      await helpers.wait.waitForToast('Availability updated')
      await helpers.assert.expectElementToContainText('[data-testid="current-rate"]', '$95/hour')
    })

    test('should manage skills and certifications', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/skills')
      
      // Add new skills
      const newSkills = ['Vue.js', 'Angular', 'Python', 'Django']
      for (const skill of newSkills) {
        await page.fill('input[data-testid="skill-input"]', skill)
        await page.press('input[data-testid="skill-input"]', 'Enter')
      }
      
      // Set skill levels
      await page.selectOption('select[data-testid="React-level"]', 'EXPERT')
      await page.selectOption('select[data-testid="TypeScript-level"]', 'ADVANCED')
      await page.selectOption('select[data-testid="Vue.js-level"]', 'INTERMEDIATE')
      
      // Add certification
      await page.click('[data-testid="add-certification"]')
      await page.fill('input[name="certificationName"]', 'AWS Certified Developer')
      await page.fill('input[name="issuingOrganization"]', 'Amazon Web Services')
      await page.fill('input[name="issueDate"]', '2023-06')
      await page.fill('input[name="credentialId"]', 'AWS-123456789')
      
      // Save skills and certifications
      await page.click('[data-testid="save-skills"]')
      
      // Verify updates
      await helpers.wait.waitForToast('Skills updated successfully')
      await helpers.assert.expectElementToBeVisible('[data-testid="certification-item"]')
    })

    test('should validate profile completeness', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile')
      
      // Check profile completeness indicator
      await helpers.assert.expectElementToBeVisible('[data-testid="profile-completeness"]')
      
      const completeness = await page.textContent('[data-testid="completeness-percentage"]')
      const percentage = parseInt(completeness?.replace('%', '') || '0')
      
      // Should be less than 100% initially
      expect(percentage).toBeLessThan(100)
      
      // Click on completeness suggestions
      await page.click('[data-testid="complete-profile-tip"]')
      
      // Should navigate to profile completion
      await helpers.assert.expectToBeOnPage('/profile/complete')
    })
  })

  test.describe('Employer Profile Management', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.employer)
    })

    test('should complete employer company profile', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/company')
      
      // Fill company information
      await page.fill('input[name="companyName"]', 'TechCorp Solutions')
      await page.fill('textarea[name="companyDescription"]', 'We are a leading technology company focused on building innovative software solutions for businesses worldwide.')
      await page.selectOption('select[name="companySize"]', '50-100')
      await page.selectOption('select[name="industry"]', 'Technology')
      await page.fill('input[name="website"]', 'https://techcorp-solutions.com')
      await page.fill('input[name="foundedYear"]', '2015')
      
      // Add company location
      await page.fill('input[name="headquarters"]', 'San Francisco, CA')
      
      // Upload company logo
      const logoPath = path.join(__dirname, 'fixtures', 'company-logo.png')
      await page.setInputFiles('input[data-testid="logo-upload"]', logoPath)
      
      // Add company values/culture
      await page.fill('textarea[name="companyValues"]', 'Innovation, Collaboration, Excellence, Integrity')
      
      // Save company profile
      await page.click('[data-testid="save-company-profile"]')
      
      // Verify success
      await helpers.wait.waitForToast('Company profile updated')
      await helpers.assert.expectElementToContainText('[data-testid="company-name"]', 'TechCorp Solutions')
      await helpers.assert.expectElementToBeVisible('[data-testid="company-logo"]')
    })

    test('should manage team members', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/team')
      
      // Add team member
      await page.click('[data-testid="add-team-member"]')
      
      // Fill team member details
      await page.fill('input[name="memberName"]', 'John Smith')
      await page.fill('input[name="memberEmail"]', 'john.smith@techcorp.com')
      await page.selectOption('select[name="memberRole"]', 'HIRING_MANAGER')
      await page.fill('input[name="memberTitle"]', 'Senior Hiring Manager')
      
      // Set permissions
      await page.check('input[data-testid="can-post-jobs"]')
      await page.check('input[data-testid="can-review-applications"]')
      
      // Save team member
      await page.click('[data-testid="save-team-member"]')
      
      // Verify team member added
      await helpers.wait.waitForToast('Team member added')
      await helpers.assert.expectElementToBeVisible('[data-testid="team-member-card"]')
      await helpers.assert.expectElementToContainText('[data-testid="member-name"]', 'John Smith')
    })

    test('should configure hiring preferences', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/hiring-preferences')
      
      // Set preferred skills
      const preferredSkills = ['React', 'Node.js', 'Python', 'AWS']
      for (const skill of preferredSkills) {
        await page.fill('input[data-testid="preferred-skills-input"]', skill)
        await page.press('input[data-testid="preferred-skills-input"]', 'Enter')
      }
      
      // Set experience level preferences
      await page.check('input[data-testid="junior-level"]')
      await page.check('input[data-testid="intermediate-level"]')
      await page.check('input[data-testid="senior-level"]')
      
      // Set location preferences
      await page.check('input[data-testid="remote-ok"]')
      await page.check('input[data-testid="hybrid-ok"]')
      
      // Set budget ranges
      await page.fill('input[name="minBudget"]', '60000')
      await page.fill('input[name="maxBudget"]', '150000')
      
      // Save preferences
      await page.click('[data-testid="save-preferences"]')
      
      // Verify success
      await helpers.wait.waitForToast('Hiring preferences updated')
    })

    test('should view and edit public company profile', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Complete company profile first
      await page.goto('/profile/company')
      await page.fill('input[name="companyName"]', 'Public Tech Corp')
      await page.fill('textarea[name="companyDescription"]', 'A public-facing description of our company.')
      await page.click('[data-testid="save-company-profile"]')
      
      // View public profile
      await page.click('[data-testid="view-public-profile"]')
      
      // Verify public profile page
      await helpers.assert.expectToBeOnPage('/companies/')
      await helpers.assert.expectElementToContainText('h1', 'Public Tech Corp')
      await helpers.assert.expectElementToContainText('[data-testid="company-description"]', 'A public-facing description')
      
      // Check if jobs are listed
      await helpers.assert.expectElementToBeVisible('[data-testid="company-jobs-section"]')
    })
  })

  test.describe('Profile Privacy and Settings', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should manage profile visibility settings', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/privacy')
      
      // Configure profile visibility
      await page.selectOption('select[data-testid="profile-visibility"]', 'PUBLIC')
      
      // Configure what information is visible
      await page.check('input[data-testid="show-email"]')
      await page.uncheck('input[data-testid="show-phone"]')
      await page.check('input[data-testid="show-location"]')
      await page.check('input[data-testid="show-rates"]')
      
      // Configure search visibility
      await page.check('input[data-testid="appear-in-search"]')
      await page.check('input[data-testid="allow-direct-contact"]')
      
      // Save privacy settings
      await page.click('[data-testid="save-privacy-settings"]')
      
      // Verify success
      await helpers.wait.waitForToast('Privacy settings updated')
    })

    test('should manage notification preferences', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/notifications')
      
      // Configure email notifications
      await page.check('input[data-testid="job-matches"]')
      await page.check('input[data-testid="application-updates"]')
      await page.uncheck('input[data-testid="marketing-emails"]')
      
      // Configure push notifications
      await page.check('input[data-testid="browser-notifications"]')
      await page.check('input[data-testid="mobile-notifications"]')
      
      // Set notification frequency
      await page.selectOption('select[data-testid="notification-frequency"]', 'DAILY')
      
      // Save notification preferences
      await page.click('[data-testid="save-notification-preferences"]')
      
      // Verify success
      await helpers.wait.waitForToast('Notification preferences updated')
    })

    test('should update account security settings', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/security')
      
      // Change password
      await page.fill('input[name="currentPassword"]', testUsers.freelancer.password)
      await page.fill('input[name="newPassword"]', 'NewSecureP@ss123!')
      await page.fill('input[name="confirmPassword"]', 'NewSecureP@ss123!')
      
      await page.click('[data-testid="change-password"]')
      
      // Verify password change
      await helpers.wait.waitForToast('Password updated successfully')
      
      // Enable two-factor authentication
      await page.click('[data-testid="enable-2fa"]')
      
      // Mock 2FA setup process
      await helpers.assert.expectElementToBeVisible('[data-testid="2fa-setup-modal"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="qr-code"]')
      
      // Enter verification code
      await page.fill('input[data-testid="2fa-code"]', '123456')
      await page.click('[data-testid="verify-2fa"]')
      
      // Verify 2FA enabled
      await helpers.wait.waitForToast('Two-factor authentication enabled')
      await helpers.assert.expectElementToBeVisible('[data-testid="2fa-enabled-status"]')
    })

    test('should export profile data', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/data')
      
      // Request data export
      await page.click('[data-testid="export-data"]')
      
      // Verify export confirmation
      await helpers.assert.expectElementToBeVisible('[data-testid="export-confirmation"]')
      await helpers.assert.expectElementToContainText('[data-testid="export-message"]', 'export will be sent to your email')
      
      // Check export status
      await helpers.assert.expectElementToBeVisible('[data-testid="export-status"]')
    })

    test('should delete account with confirmation', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/profile/security')
      
      // Scroll to danger zone
      await page.click('[data-testid="delete-account"]')
      
      // Verify deletion warning
      await helpers.wait.waitForModal('delete-account-modal')
      await helpers.assert.expectElementToContainText('[data-testid="deletion-warning"]', 'This action cannot be undone')
      
      // Enter confirmation text
      await page.fill('input[data-testid="delete-confirmation"]', 'DELETE MY ACCOUNT')
      
      // Enter password
      await page.fill('input[data-testid="password-confirmation"]', testUsers.freelancer.password)
      
      // Cancel instead of actually deleting
      await page.click('[data-testid="cancel-deletion"]')
      
      // Verify cancellation
      await helpers.assert.expectElementToBeHidden('[data-testid="delete-account-modal"]')
    })
  })
})