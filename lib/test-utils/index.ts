// Test utilities and helpers
import { render, RenderOptions } from '@testing-library/react'
import { ReactElement, ReactNode } from 'react'
import { SessionProvider } from 'next-auth/react'
import { AnalyticsProvider } from '@/components/analytics/analytics-provider'
import { ErrorBoundary } from '@/lib/error-boundary'
import { ErrorFallback } from '@/components/error-fallback'

// Mock session data
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  role: 'FREELANCER',
  name: 'Test User',
  image: null,
}

export const mockEmployer = {
  id: 'test-employer-id',
  email: 'employer@example.com',
  role: 'EMPLOYER',
  name: 'Test Employer',
  image: null,
}

export const mockAdmin = {
  id: 'test-admin-id',
  email: 'admin@example.com',
  role: 'ADMIN',
  name: 'Test Admin',
  image: null,
}

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: typeof mockUser | null
  session?: any
}

function AllTheProviders({ 
  children, 
  user = null,
  session = null,
}: { 
  children: ReactNode
  user?: typeof mockUser | null
  session?: any
}) {
  const sessionData = session || (user ? { user } : null)
  
  return (
    <SessionProvider session={sessionData}>
      <AnalyticsProvider>
        <ErrorBoundary fallback={<ErrorFallback />}>
          {children}
        </ErrorBoundary>
      </AnalyticsProvider>
    </SessionProvider>
  )
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { user, session, ...renderOptions } = options
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders user={user} session={session}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Test data factories
export const testData = {
  // User data
  user: (overrides = {}) => ({
    id: 'user-1',
    email: 'user@example.com',
    role: 'FREELANCER',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      country: 'US',
      avatar: null,
    },
    freelancerProfile: {
      title: 'Frontend Developer',
      bio: 'Experienced developer',
      hourlyRate: 50,
      skills: [
        { skill: { name: 'React' } },
        { skill: { name: 'TypeScript' } },
      ],
    },
    ...overrides,
  }),

  // Job data
  job: (overrides = {}) => ({
    id: 'job-1',
    title: 'Frontend Developer Position',
    description: 'We are looking for a skilled frontend developer to join our team.',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    experienceLevel: 'INTERMEDIATE',
    isRemote: true,
    salaryMin: 60000,
    salaryMax: 80000,
    currency: 'USD',
    publishedAt: new Date().toISOString(),
    employer: {
      id: 'employer-1',
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
      employerProfile: {
        companyName: 'Tech Corp',
        companyLogo: null,
      },
    },
    skills: [
      { skill: { name: 'React' }, isRequired: true },
      { skill: { name: 'TypeScript' }, isRequired: false },
    ],
    _count: { applications: 5 },
    ...overrides,
  }),

  // Application data
  application: (overrides = {}) => ({
    id: 'app-1',
    jobId: 'job-1',
    applicantId: 'user-1',
    coverLetter: 'I am interested in this position...',
    proposedRate: 75,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    job: testData.job(),
    freelancer: testData.user(),
    ...overrides,
  }),

  // Message data
  message: (overrides = {}) => ({
    id: 'msg-1',
    content: 'Hello, I am interested in your job posting.',
    senderId: 'user-1',
    conversationId: 'conv-1',
    createdAt: new Date().toISOString(),
    isRead: false,
    sender: {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    },
    ...overrides,
  }),

  // Payment data
  payment: (overrides = {}) => ({
    id: 'payment-1',
    amount: 5000, // $50.00
    currency: 'USD',
    status: 'COMPLETED',
    payerId: 'employer-1',
    recipientId: 'user-1',
    jobId: 'job-1',
    stripePaymentId: 'pi_test_123',
    createdAt: new Date().toISOString(),
    ...overrides,
  }),
}

// Mock functions
export const mockFunctions = {
  // Next.js router
  mockRouter: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  },

  // Fetch mock
  mockFetch: (response: any, status = 200) => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        json: () => Promise.resolve(response),
        text: () => Promise.resolve(JSON.stringify(response)),
      })
    ) as jest.Mock
  },

  // Local storage mock
  mockLocalStorage: () => {
    const store: Record<string, string> = {}
    
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key]
        }),
        clear: jest.fn(() => {
          Object.keys(store).forEach(key => delete store[key])
        }),
      },
      writable: true,
    })
  },

  // Session storage mock
  mockSessionStorage: () => {
    const store: Record<string, string> = {}
    
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: jest.fn((key: string) => store[key] || null),
        setItem: jest.fn((key: string, value: string) => {
          store[key] = value
        }),
        removeItem: jest.fn((key: string) => {
          delete store[key]
        }),
        clear: jest.fn(() => {
          Object.keys(store).forEach(key => delete store[key])
        }),
      },
      writable: true,
    })
  },
}

// Test helpers
export const testHelpers = {
  // Wait for element to appear
  waitForLoadingToFinish: () => {
    return new Promise((resolve) => {
      setTimeout(resolve, 0)
    })
  },

  // Simulate user typing
  type: async (element: HTMLElement, text: string) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.type(element, text)
  },

  // Simulate user clicking
  click: async (element: HTMLElement) => {
    const { userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    await user.click(element)
  },

  // Create mock file
  createMockFile: (name = 'test.jpg', type = 'image/jpeg', size = 1024) => {
    return new File(['test content'], name, { type, lastModified: Date.now() })
  },

  // Create form data with file
  createFormDataWithFile: (file: File, fieldName = 'file') => {
    const formData = new FormData()
    formData.append(fieldName, file)
    return formData
  },
}

// Database test helpers (if using a test database)
export const dbTestHelpers = {
  // Clean database
  cleanDatabase: async () => {
    // This would clean the test database
    // Implementation depends on your database setup
    console.log('Cleaning test database...')
  },

  // Seed test data
  seedTestData: async () => {
    // This would seed the test database with initial data
    console.log('Seeding test database...')
  },
}

// Re-export testing library utilities
export * from '@testing-library/react'
export * from '@testing-library/jest-dom'
export { renderWithProviders as render }