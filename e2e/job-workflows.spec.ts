// E2E tests for job posting and application workflows
import { test, expect } from '@playwright/test'
import { createHelpers, testUsers, testJobs } from './utils/test-helpers'

test.describe('Job Workflows', () => {
  test.describe('Job Posting (Employer)', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.employer)
    })

    test('should create a new job posting successfully', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Navigate to job creation
      await page.goto('/dashboard/jobs/create')
      await helpers.assert.expectToBeOnPage('/dashboard/jobs/create')
      
      // Fill job details
      await page.fill('input[name="title"]', testJobs.frontendDeveloper.title)
      await page.fill('textarea[name="description"]', testJobs.frontendDeveloper.description)
      await page.selectOption('select[name="employmentType"]', testJobs.frontendDeveloper.employmentType)
      await page.selectOption('select[name="experienceLevel"]', testJobs.frontendDeveloper.experienceLevel)
      
      // Remote work checkbox
      if (testJobs.frontendDeveloper.isRemote) {
        await page.check('input[name="isRemote"]')
      }
      
      // Salary range
      await page.fill('input[name="salaryMin"]', testJobs.frontendDeveloper.salaryMin.toString())
      await page.fill('input[name="salaryMax"]', testJobs.frontendDeveloper.salaryMax.toString())
      await page.selectOption('select[name="currency"]', testJobs.frontendDeveloper.currency)
      
      // Add skills
      for (const skill of testJobs.frontendDeveloper.skills) {
        await page.fill('input[data-testid="skill-input"]', skill)
        await page.press('input[data-testid="skill-input"]', 'Enter')
        await helpers.assert.expectElementToBeVisible(`[data-testid="skill-tag"]:has-text("${skill}")`)
      }
      
      // Submit job
      await page.click('button[type="submit"]')
      
      // Verify success
      await helpers.wait.waitForToast('Job created successfully')
      await helpers.assert.expectToBeOnPage('/dashboard/jobs')
      await helpers.assert.expectElementToContainText('[data-testid="job-title"]', testJobs.frontendDeveloper.title)
    })

    test('should validate required fields in job creation', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/jobs/create')
      
      // Try to submit without required fields
      await page.click('button[type="submit"]')
      
      // Verify validation errors
      await helpers.assert.expectElementToBeVisible('[data-testid="title-error"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="description-error"]')
      await helpers.assert.expectElementToContainText('[data-testid="title-error"]', 'Title is required')
      await helpers.assert.expectElementToContainText('[data-testid="description-error"]', 'Description is required')
    })

    test('should validate salary range correctly', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/jobs/create')
      
      // Fill basic required fields
      await page.fill('input[name="title"]', 'Test Job')
      await page.fill('textarea[name="description"]', 'Test description')
      
      // Set invalid salary range (max < min)
      await page.fill('input[name="salaryMin"]', '100000')
      await page.fill('input[name="salaryMax"]', '50000')
      
      await page.click('button[type="submit"]')
      
      // Verify salary validation error
      await helpers.assert.expectElementToBeVisible('[data-testid="salary-error"]')
      await helpers.assert.expectElementToContainText('[data-testid="salary-error"]', 'Maximum salary must be greater than minimum salary')
    })

    test('should save job as draft and publish later', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/jobs/create')
      
      // Fill job details
      await page.fill('input[name="title"]', testJobs.frontendDeveloper.title)
      await page.fill('textarea[name="description"]', testJobs.frontendDeveloper.description)
      
      // Save as draft
      await page.click('button[data-testid="save-draft"]')
      
      await helpers.wait.waitForToast('Job saved as draft')
      await helpers.assert.expectToBeOnPage('/dashboard/jobs')
      
      // Verify draft status
      await helpers.assert.expectElementToBeVisible('[data-testid="job-status"]:has-text("Draft")')
      
      // Edit and publish
      await page.click('[data-testid="edit-job-button"]')
      await page.click('button[data-testid="publish-job"]')
      
      await helpers.wait.waitForToast('Job published successfully')
      await helpers.assert.expectElementToBeVisible('[data-testid="job-status"]:has-text("Active")')
    })

    test('should edit existing job', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Create a job first
      await helpers.jobs.createJob(testJobs.frontendDeveloper)
      
      // Navigate to job list and edit
      await page.goto('/dashboard/jobs')
      await page.click('[data-testid="edit-job-button"]')
      
      // Modify job details
      const updatedTitle = 'Updated Frontend Developer Position'
      await page.fill('input[name="title"]', updatedTitle)
      
      await page.click('button[type="submit"]')
      
      // Verify update
      await helpers.wait.waitForToast('Job updated successfully')
      await helpers.assert.expectElementToContainText('[data-testid="job-title"]', updatedTitle)
    })

    test('should delete job', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Create a job first
      await helpers.jobs.createJob(testJobs.frontendDeveloper)
      
      // Navigate to job list and delete
      await page.goto('/dashboard/jobs')
      await page.click('[data-testid="delete-job-button"]')
      
      // Confirm deletion in modal
      await helpers.wait.waitForModal('delete-confirmation')
      await page.click('[data-testid="confirm-delete"]')
      
      // Verify deletion
      await helpers.wait.waitForToast('Job deleted successfully')
      await helpers.assert.expectElementToBeHidden(`[data-testid="job-card"]:has-text("${testJobs.frontendDeveloper.title}")`)
    })
  })

  test.describe('Job Search and Application (Freelancer)', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Create employer and job
      await helpers.auth.register(testUsers.employer)
      await helpers.jobs.createJob(testJobs.frontendDeveloper)
      await helpers.auth.logout()
      
      // Register freelancer
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should search and filter jobs successfully', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await helpers.nav.goToJobsPage()
      
      // Verify jobs are loaded
      const jobCount = await helpers.jobs.getJobCards()
      expect(jobCount).toBeGreaterThan(0)
      
      // Search by title
      await page.fill('input[data-testid="job-search"]', 'Frontend')
      await page.press('input[data-testid="job-search"]', 'Enter')
      await helpers.wait.waitForPageLoad()
      
      // Verify search results
      await helpers.assert.expectElementToBeVisible(`[data-testid="job-card"]:has-text("${testJobs.frontendDeveloper.title}")`)
      
      // Filter by employment type
      await page.selectOption('select[data-testid="employment-filter"]', 'FULL_TIME')
      await helpers.wait.waitForPageLoad()
      
      // Verify filtered results
      await helpers.assert.expectElementToBeVisible('[data-testid="job-card"][data-employment="FULL_TIME"]')
      
      // Filter by remote work
      await page.check('input[data-testid="remote-filter"]')
      await helpers.wait.waitForPageLoad()
      
      // Verify remote jobs are shown
      await helpers.assert.expectElementToBeVisible('[data-testid="remote-badge"]')
    })

    test('should view job details', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await helpers.nav.goToJobsPage()
      
      // Click on first job card
      await page.click('[data-testid="job-card"]:first-child')
      
      // Verify job details page
      await helpers.assert.expectToBeOnPage('/jobs/')
      await helpers.assert.expectElementToContainText('h1', testJobs.frontendDeveloper.title)
      await helpers.assert.expectElementToContainText('[data-testid="job-description"]', testJobs.frontendDeveloper.description)
      await helpers.assert.expectElementToContainText('[data-testid="salary-range"]', '$80,000 - $120,000')
      
      // Verify skills are displayed
      for (const skill of testJobs.frontendDeveloper.skills) {
        await helpers.assert.expectElementToBeVisible(`[data-testid="skill-badge"]:has-text("${skill}")`)
      }
      
      // Verify apply button is present
      await helpers.assert.expectElementToBeVisible('[data-testid="apply-button"]')
    })

    test('should apply to job successfully', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      
      const coverLetter = 'I am very interested in this position and believe my experience with React and TypeScript makes me a great fit for your team. I have 5 years of experience building modern web applications.'
      const proposedRate = 85
      
      // Apply to job
      await helpers.jobs.applyToJob(coverLetter, proposedRate)
      
      // Verify application success
      await helpers.assert.expectElementToBeVisible('[data-testid="application-success"]')
      await helpers.assert.expectElementToContainText('[data-testid="success-message"]', 'Application submitted successfully')
      
      // Verify apply button is now disabled
      await helpers.assert.expectElementToContainText('[data-testid="apply-button"]', 'Applied')
      expect(await page.locator('[data-testid="apply-button"]').isDisabled()).toBe(true)
    })

    test('should validate application form', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      await page.click('[data-testid="apply-button"]')
      
      // Try to submit without required fields
      await page.click('button[data-testid="submit-application"]')
      
      // Verify validation errors
      await helpers.assert.expectElementToBeVisible('[data-testid="coverLetter-error"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="proposedRate-error"]')
      
      // Test minimum cover letter length
      await page.fill('textarea[name="coverLetter"]', 'Too short')
      await page.click('button[data-testid="submit-application"]')
      
      await helpers.assert.expectElementToContainText('[data-testid="coverLetter-error"]', 'Cover letter must be at least 50 characters')
      
      // Test invalid proposed rate
      await page.fill('input[name="proposedRate"]', '0')
      await page.click('button[data-testid="submit-application"]')
      
      await helpers.assert.expectElementToContainText('[data-testid="proposedRate-error"]', 'Rate must be between $10 and $500')
    })

    test('should prevent duplicate applications', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Apply to job first time
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      await helpers.jobs.applyToJob('I am interested in this position and have the required skills.', 75)
      
      // Try to apply again
      await page.reload()
      
      // Verify apply button shows "Applied" state
      await helpers.assert.expectElementToContainText('[data-testid="apply-button"]', 'Applied')
      expect(await page.locator('[data-testid="apply-button"]').isDisabled()).toBe(true)
    })

    test('should view application status in dashboard', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Apply to job
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      await helpers.jobs.applyToJob('I am interested in this position.', 75)
      
      // Go to applications dashboard
      await page.goto('/dashboard/applications')
      
      // Verify application is listed
      await helpers.assert.expectElementToBeVisible(`[data-testid="application-card"]:has-text("${testJobs.frontendDeveloper.title}")`)
      await helpers.assert.expectElementToBeVisible('[data-testid="application-status"]:has-text("Pending")')
      
      // Click to view application details
      await page.click('[data-testid="view-application"]')
      
      // Verify application details
      await helpers.assert.expectElementToContainText('[data-testid="cover-letter"]', 'I am interested in this position.')
      await helpers.assert.expectElementToContainText('[data-testid="proposed-rate"]', '$75')
    })
  })

  test.describe('Application Management (Employer)', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Create employer and job
      await helpers.auth.register(testUsers.employer)
      await helpers.jobs.createJob(testJobs.frontendDeveloper)
      await helpers.auth.logout()
      
      // Create freelancer and apply to job
      await helpers.auth.register(testUsers.freelancer)
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      await helpers.jobs.applyToJob('I am perfect for this role with 5 years of React experience.', 85)
      await helpers.auth.logout()
      
      // Login as employer
      await helpers.auth.login(testUsers.employer.email, testUsers.employer.password)
    })

    test('should view and manage job applications', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Go to applications dashboard
      await page.goto('/dashboard/applications')
      
      // Verify application is listed
      await helpers.assert.expectElementToBeVisible('[data-testid="application-card"]')
      await helpers.assert.expectElementToContainText('[data-testid="applicant-name"]', testUsers.freelancer.firstName)
      
      // View application details
      await page.click('[data-testid="view-application"]')
      
      // Verify application details are shown
      await helpers.assert.expectElementToContainText('[data-testid="cover-letter"]', 'I am perfect for this role')
      await helpers.assert.expectElementToContainText('[data-testid="proposed-rate"]', '$85')
    })

    test('should accept application', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/applications')
      await page.click('[data-testid="view-application"]')
      
      // Accept application
      await page.click('[data-testid="accept-application"]')
      
      // Fill acceptance message
      await page.fill('textarea[data-testid="employer-message"]', 'Congratulations! We would like to hire you for this position. Please let us know your availability.')
      await page.click('[data-testid="confirm-accept"]')
      
      // Verify success
      await helpers.wait.waitForToast('Application accepted')
      await helpers.assert.expectElementToBeVisible('[data-testid="application-status"]:has-text("Accepted")')
    })

    test('should reject application', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/applications')
      await page.click('[data-testid="view-application"]')
      
      // Reject application
      await page.click('[data-testid="reject-application"]')
      
      // Fill rejection message
      await page.fill('textarea[data-testid="employer-message"]', 'Thank you for your application. Unfortunately, we have decided to move forward with another candidate.')
      await page.click('[data-testid="confirm-reject"]')
      
      // Verify success
      await helpers.wait.waitForToast('Application rejected')
      await helpers.assert.expectElementToBeVisible('[data-testid="application-status"]:has-text("Rejected")')
    })

    test('should filter applications by status', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/applications')
      
      // Filter by pending applications
      await page.selectOption('select[data-testid="status-filter"]', 'PENDING')
      await helpers.wait.waitForPageLoad()
      
      // Verify only pending applications are shown
      const applicationCards = page.locator('[data-testid="application-card"]')
      for (let i = 0; i < await applicationCards.count(); i++) {
        await expect(applicationCards.nth(i).locator('[data-testid="application-status"]')).toContainText('Pending')
      }
    })

    test('should view freelancer profile from application', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/applications')
      await page.click('[data-testid="view-application"]')
      
      // Click on freelancer profile link
      await page.click('[data-testid="view-freelancer-profile"]')
      
      // Verify freelancer profile page
      await helpers.assert.expectToBeOnPage('/talent/')
      await helpers.assert.expectElementToContainText('h1', `${testUsers.freelancer.firstName} ${testUsers.freelancer.lastName}`)
    })
  })
})