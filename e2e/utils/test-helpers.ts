// E2E test helpers and utilities
import { Page, expect } from '@playwright/test'

// Test user data
export const testUsers = {
  freelancer: {
    email: 'freelancer@e2etest.com',
    password: 'TestPassword123!',
    firstName: 'John',
    lastName: 'Doe',
    role: 'FREELANCER',
    country: 'US',
  },
  employer: {
    email: 'employer@e2etest.com',
    password: 'TestPassword123!',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'EMPLOYER',
    companyName: 'E2E Test Corp',
  },
  admin: {
    email: 'admin@e2etest.com',
    password: 'TestPassword123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
  },
}

// Test job data
export const testJobs = {
  frontendDeveloper: {
    title: 'Senior Frontend Developer',
    description: 'We are looking for an experienced React developer to join our team. You will be responsible for building modern web applications using the latest technologies.',
    employmentType: 'FULL_TIME',
    experienceLevel: 'SENIOR',
    isRemote: true,
    salaryMin: 80000,
    salaryMax: 120000,
    currency: 'USD',
    skills: ['React', 'TypeScript', 'Next.js'],
  },
  backendDeveloper: {
    title: 'Backend Developer',
    description: 'Looking for a skilled backend developer with Node.js experience.',
    employmentType: 'CONTRACT',
    experienceLevel: 'INTERMEDIATE',
    isRemote: false,
    salaryMin: 60000,
    salaryMax: 90000,
    currency: 'USD',
    skills: ['Node.js', 'Express', 'MongoDB'],
  },
}

// Navigation helpers
export class NavigationHelpers {
  constructor(private page: Page) {}

  async goToHomePage() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  async goToJobsPage() {
    await this.page.goto('/jobs')
    await this.page.waitForLoadState('networkidle')
  }

  async goToTalentPage() {
    await this.page.goto('/talent')
    await this.page.waitForLoadState('networkidle')
  }

  async goToLoginPage() {
    await this.page.goto('/auth/signin')
    await this.page.waitForLoadState('networkidle')
  }

  async goToRegisterPage() {
    await this.page.goto('/auth/register')
    await this.page.waitForLoadState('networkidle')
  }

  async goToDashboard() {
    await this.page.goto('/dashboard')
    await this.page.waitForLoadState('networkidle')
  }

  async goToProfile() {
    await this.page.goto('/profile')
    await this.page.waitForLoadState('networkidle')
  }
}

// Authentication helpers
export class AuthHelpers {
  constructor(private page: Page) {}

  async register(userData: typeof testUsers.freelancer | typeof testUsers.employer) {
    await this.page.goto('/auth/register')
    await this.page.waitForLoadState('networkidle')

    // Fill registration form
    await this.page.fill('input[name="email"]', userData.email)
    await this.page.fill('input[name="password"]', userData.password)
    await this.page.selectOption('select[name="role"]', userData.role)
    await this.page.fill('input[name="firstName"]', userData.firstName)
    await this.page.fill('input[name="lastName"]', userData.lastName)

    if (userData.role === 'FREELANCER') {
      await this.page.selectOption('select[name="country"]', userData.country)
    } else if (userData.role === 'EMPLOYER') {
      await this.page.fill('input[name="companyName"]', (userData as any).companyName)
    }

    // Submit form
    await this.page.click('button[type="submit"]')
    
    // Wait for redirect or success message
    await this.page.waitForURL('**/dashboard')
  }

  async login(email: string, password: string) {
    await this.page.goto('/auth/signin')
    await this.page.waitForLoadState('networkidle')

    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')

    // Wait for successful login
    await this.page.waitForURL('**/dashboard')
  }

  async logout() {
    // Click user menu
    await this.page.click('[data-testid="user-menu"]')
    
    // Click logout
    await this.page.click('[data-testid="logout-button"]')
    
    // Wait for redirect to home
    await this.page.waitForURL('/')
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 3000 })
      return true
    } catch {
      return false
    }
  }
}

// Job helpers
export class JobHelpers {
  constructor(private page: Page) {}

  async createJob(jobData: typeof testJobs.frontendDeveloper) {
    await this.page.goto('/dashboard/jobs/create')
    await this.page.waitForLoadState('networkidle')

    // Fill job form
    await this.page.fill('input[name="title"]', jobData.title)
    await this.page.fill('textarea[name="description"]', jobData.description)
    await this.page.selectOption('select[name="employmentType"]', jobData.employmentType)
    await this.page.selectOption('select[name="experienceLevel"]', jobData.experienceLevel)
    
    if (jobData.isRemote) {
      await this.page.check('input[name="isRemote"]')
    }

    await this.page.fill('input[name="salaryMin"]', jobData.salaryMin.toString())
    await this.page.fill('input[name="salaryMax"]', jobData.salaryMax.toString())
    await this.page.selectOption('select[name="currency"]', jobData.currency)

    // Add skills
    for (const skill of jobData.skills) {
      await this.page.fill('input[data-testid="skill-input"]', skill)
      await this.page.press('input[data-testid="skill-input"]', 'Enter')
    }

    // Submit job
    await this.page.click('button[type="submit"]')
    
    // Wait for success
    await this.page.waitForSelector('[data-testid="success-message"]')
  }

  async searchJobs(searchTerm: string) {
    await this.page.goto('/jobs')
    await this.page.waitForLoadState('networkidle')

    await this.page.fill('input[data-testid="job-search"]', searchTerm)
    await this.page.press('input[data-testid="job-search"]', 'Enter')
    
    await this.page.waitForLoadState('networkidle')
  }

  async applyToJob(coverLetter: string, proposedRate: number) {
    // Click apply button
    await this.page.click('[data-testid="apply-button"]')
    
    // Wait for application modal
    await this.page.waitForSelector('[data-testid="application-modal"]')
    
    // Fill application form
    await this.page.fill('textarea[name="coverLetter"]', coverLetter)
    await this.page.fill('input[name="proposedRate"]', proposedRate.toString())
    
    // Submit application
    await this.page.click('button[data-testid="submit-application"]')
    
    // Wait for success message
    await this.page.waitForSelector('[data-testid="application-success"]')
  }

  async getJobCards() {
    await this.page.waitForSelector('[data-testid="job-card"]')
    return await this.page.locator('[data-testid="job-card"]').count()
  }
}

// Form helpers
export class FormHelpers {
  constructor(private page: Page) {}

  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `input[name="${field}"], textarea[name="${field}"], select[name="${field}"]`
      await this.page.fill(selector, value)
    }
  }

  async submitForm(submitSelector = 'button[type="submit"]') {
    await this.page.click(submitSelector)
  }

  async waitForFormError(fieldName?: string) {
    const selector = fieldName 
      ? `[data-testid="${fieldName}-error"]` 
      : '[data-testid="form-error"]'
    await this.page.waitForSelector(selector)
  }

  async waitForFormSuccess() {
    await this.page.waitForSelector('[data-testid="form-success"]')
  }
}

// Profile helpers
export class ProfileHelpers {
  constructor(private page: Page) {}

  async updateFreelancerProfile(profileData: {
    title?: string
    bio?: string
    hourlyRate?: number
    skills?: string[]
  }) {
    await this.page.goto('/profile/edit')
    await this.page.waitForLoadState('networkidle')

    if (profileData.title) {
      await this.page.fill('input[name="title"]', profileData.title)
    }

    if (profileData.bio) {
      await this.page.fill('textarea[name="bio"]', profileData.bio)
    }

    if (profileData.hourlyRate) {
      await this.page.fill('input[name="hourlyRate"]', profileData.hourlyRate.toString())
    }

    if (profileData.skills) {
      // Clear existing skills first
      const skillTags = await this.page.locator('[data-testid="skill-tag"]').count()
      for (let i = 0; i < skillTags; i++) {
        await this.page.click('[data-testid="remove-skill"]:first-child')
      }

      // Add new skills
      for (const skill of profileData.skills) {
        await this.page.fill('input[data-testid="skill-input"]', skill)
        await this.page.press('input[data-testid="skill-input"]', 'Enter')
      }
    }

    await this.page.click('button[type="submit"]')
    await this.page.waitForSelector('[data-testid="profile-updated"]')
  }

  async uploadAvatar(filePath: string) {
    await this.page.goto('/profile/edit')
    await this.page.waitForLoadState('networkidle')

    await this.page.setInputFiles('input[data-testid="avatar-upload"]', filePath)
    await this.page.waitForSelector('[data-testid="avatar-uploaded"]')
  }
}

// Wait helpers
export class WaitHelpers {
  constructor(private page: Page) {}

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async waitForApiCall(urlPattern: string) {
    await this.page.waitForResponse(response => 
      response.url().includes(urlPattern) && response.status() === 200
    )
  }

  async waitForToast(message?: string) {
    if (message) {
      await this.page.waitForSelector(`[data-testid="toast"]:has-text("${message}")`)
    } else {
      await this.page.waitForSelector('[data-testid="toast"]')
    }
  }

  async waitForModal(modalId?: string) {
    const selector = modalId ? `[data-testid="${modalId}"]` : '[role="dialog"]'
    await this.page.waitForSelector(selector)
  }
}

// Assertion helpers
export class AssertionHelpers {
  constructor(private page: Page) {}

  async expectToBeOnPage(urlPattern: string) {
    await expect(this.page).toHaveURL(new RegExp(urlPattern))
  }

  async expectElementToContainText(selector: string, text: string) {
    await expect(this.page.locator(selector)).toContainText(text)
  }

  async expectElementToBeVisible(selector: string) {
    await expect(this.page.locator(selector)).toBeVisible()
  }

  async expectElementToBeHidden(selector: string) {
    await expect(this.page.locator(selector)).toBeHidden()
  }

  async expectElementCount(selector: string, count: number) {
    await expect(this.page.locator(selector)).toHaveCount(count)
  }
}

// Create helper instances
export function createHelpers(page: Page) {
  return {
    nav: new NavigationHelpers(page),
    auth: new AuthHelpers(page),
    jobs: new JobHelpers(page),
    forms: new FormHelpers(page),
    profile: new ProfileHelpers(page),
    wait: new WaitHelpers(page),
    assert: new AssertionHelpers(page),
  }
}