// MSW (Mock Service Worker) server for API mocking in tests
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// Mock API handlers
export const handlers = [
  // Auth endpoints
  http.post('/api/auth/register', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'FREELANCER',
      },
    }, { status: 201 })
  }),

  http.post('/api/auth/signin', () => {
    return HttpResponse.json({
      success: true,
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        role: 'FREELANCER',
      },
    })
  }),

  // Job endpoints
  http.get('/api/jobs', () => {
    return HttpResponse.json({
      jobs: [
        {
          id: 'job-1',
          title: 'Frontend Developer',
          description: 'Looking for a skilled frontend developer',
          status: 'ACTIVE',
          employer: {
            profile: {
              firstName: 'John',
              lastName: 'Doe',
            },
          },
          skills: [
            { skill: { name: 'React' } },
            { skill: { name: 'TypeScript' } },
          ],
          _count: { applications: 5 },
        },
      ],
      total: 1,
      pages: 1,
      currentPage: 1,
    })
  }),

  http.post('/api/jobs', () => {
    return HttpResponse.json({
      success: true,
      job: {
        id: 'new-job-id',
        title: 'New Job',
        description: 'Job description',
        status: 'DRAFT',
      },
    }, { status: 201 })
  }),

  http.get('/api/jobs/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      id,
      title: 'Frontend Developer',
      description: 'Looking for a skilled frontend developer',
      status: 'ACTIVE',
      employer: {
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      },
      skills: [
        { skill: { name: 'React' } },
        { skill: { name: 'TypeScript' } },
      ],
      _count: { applications: 5 },
    })
  }),

  // Application endpoints
  http.post('/api/jobs/:id/apply', ({ params }) => {
    return HttpResponse.json({
      success: true,
      application: {
        id: 'application-id',
        jobId: params.id,
        status: 'PENDING',
      },
    }, { status: 201 })
  }),

  http.get('/api/applications', () => {
    return HttpResponse.json({
      applications: [
        {
          id: 'app-1',
          status: 'PENDING',
          job: {
            title: 'Frontend Developer',
            employer: {
              profile: {
                firstName: 'John',
                lastName: 'Doe',
              },
            },
          },
        },
      ],
      total: 1,
    })
  }),

  // User/Profile endpoints
  http.get('/api/user/profile', () => {
    return HttpResponse.json({
      id: 'user-id',
      email: 'test@example.com',
      role: 'FREELANCER',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        country: 'US',
      },
      freelancerProfile: {
        title: 'Frontend Developer',
        bio: 'Experienced developer',
        hourlyRate: 50,
      },
    })
  }),

  http.put('/api/user/profile', () => {
    return HttpResponse.json({
      success: true,
      message: 'Profile updated successfully',
    })
  }),

  // Payment endpoints
  http.post('/api/payment/create-intent', () => {
    return HttpResponse.json({
      clientSecret: 'pi_test_client_secret',
      paymentIntentId: 'pi_test_123',
    })
  }),

  http.post('/api/payment/confirm', () => {
    return HttpResponse.json({
      success: true,
      payment: {
        id: 'payment-id',
        status: 'COMPLETED',
        amount: 5000,
      },
    })
  }),

  // Message endpoints
  http.get('/api/messages', () => {
    return HttpResponse.json({
      conversations: [
        {
          id: 'conv-1',
          participants: [
            {
              user: {
                profile: {
                  firstName: 'John',
                  lastName: 'Doe',
                },
              },
            },
          ],
          messages: [
            {
              id: 'msg-1',
              content: 'Hello there!',
              createdAt: new Date().toISOString(),
              sender: {
                profile: {
                  firstName: 'John',
                  lastName: 'Doe',
                },
              },
            },
          ],
        },
      ],
    })
  }),

  http.post('/api/messages', () => {
    return HttpResponse.json({
      success: true,
      message: {
        id: 'new-message-id',
        content: 'Message sent',
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  }),

  // Analytics endpoints
  http.post('/api/analytics/track', () => {
    return HttpResponse.json({ success: true })
  }),

  // File upload endpoints
  http.post('/api/upload', () => {
    return HttpResponse.json({
      success: true,
      url: 'https://example.com/uploaded-file.jpg',
      publicId: 'test-public-id',
    })
  }),

  // Admin endpoints
  http.get('/api/admin/users', () => {
    return HttpResponse.json({
      users: [
        {
          id: 'user-1',
          email: 'user1@example.com',
          role: 'FREELANCER',
          profile: {
            firstName: 'User',
            lastName: 'One',
          },
        },
      ],
      total: 1,
    })
  }),

  http.get('/api/admin/security', () => {
    return HttpResponse.json({
      metrics: {
        totalRequests: 1000,
        blockedRequests: 50,
        rateLimitedRequests: 25,
        suspiciousActivity: 10,
        authFailures: 15,
      },
      alerts: [],
    })
  }),

  // Error tracking
  http.post('/api/error-tracking', () => {
    return HttpResponse.json({ success: true })
  }),

  // Health check
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
    })
  }),
]

// Create the server
export const server = setupServer(...handlers)