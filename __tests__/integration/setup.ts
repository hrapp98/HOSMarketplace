// Integration test setup
import { createMocks } from 'node-mocks-http'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

// Mock NextAuth session
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}))

// Mock Prisma
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  job: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  application: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  message: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  analyticsEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  securityEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
}

// Mock external services
jest.mock('stripe', () => {
  return jest.fn(() => ({
    paymentIntents: {
      create: jest.fn(),
      confirm: jest.fn(),
      retrieve: jest.fn(),
    },
    customers: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
    accounts: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  }))
})

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn(),
    verify: jest.fn(),
  })),
}))

jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: jest.fn(),
      destroy: jest.fn(),
    },
  },
}))

// Test helpers
export const createTestSession = (userData: any = {}) => {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'FREELANCER',
    name: 'Test User',
    ...userData,
  }

  return {
    user: defaultUser,
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  }
}

export const mockAuthSession = (session: any = null) => {
  const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
  mockGetServerSession.mockResolvedValue(session)
}

export const createTestRequest = (
  method: string,
  url: string,
  body?: any,
  headers?: Record<string, string>
) => {
  const { req } = createMocks({
    method,
    url,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })

  // Convert to NextRequest-like object
  return {
    method,
    url,
    json: async () => body,
    headers: new Headers(req.headers as Record<string, string>),
    nextUrl: new URL(url, 'http://localhost:3000'),
  } as NextRequest
}

export const extractResponseData = async (response: NextResponse | Response) => {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export const testData = {
  user: {
    id: 'user-123',
    email: 'user@example.com',
    role: 'FREELANCER',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      country: 'US',
    },
    freelancerProfile: {
      title: 'Frontend Developer',
      bio: 'Experienced developer',
      hourlyRate: 50,
    },
  },
  employer: {
    id: 'employer-123',
    email: 'employer@example.com',
    role: 'EMPLOYER',
    profile: {
      firstName: 'Jane',
      lastName: 'Smith',
    },
    employerProfile: {
      companyName: 'Tech Corp',
    },
  },
  job: {
    id: 'job-123',
    title: 'Frontend Developer Position',
    description: 'Looking for a skilled frontend developer',
    status: 'ACTIVE',
    employmentType: 'FULL_TIME',
    experienceLevel: 'INTERMEDIATE',
    isRemote: true,
    salaryMin: 60000,
    salaryMax: 80000,
    currency: 'USD',
    employerId: 'employer-123',
    skills: [
      { skill: { name: 'React' }, isRequired: true },
      { skill: { name: 'TypeScript' }, isRequired: false },
    ],
  },
  application: {
    id: 'app-123',
    jobId: 'job-123',
    applicantId: 'user-123',
    coverLetter: 'I am interested in this position',
    proposedRate: 75,
    status: 'PENDING',
  },
}

export { mockPrisma }