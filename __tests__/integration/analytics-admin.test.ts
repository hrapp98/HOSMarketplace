// Analytics and Admin API integration tests
import { POST as trackAnalytics } from '@/app/api/analytics/track/route'
import { GET as getSecurityMetrics } from '@/app/api/admin/security/route'
import { POST as uploadFile } from '@/app/api/upload/route'
import { 
  createTestRequest, 
  createTestSession,
  extractResponseData, 
  mockAuthSession,
  mockPrisma,
  testData 
} from './setup'

// Mock Cloudinary
const mockCloudinaryUpload = jest.fn()
jest.mock('cloudinary', () => ({
  v2: {
    uploader: {
      upload: mockCloudinaryUpload,
    },
  },
}))

describe('/api/analytics and /api/admin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/analytics/track', () => {
    it('should track analytics event', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const eventData = {
        event: 'job_viewed',
        properties: {
          jobId: 'job-123',
          jobTitle: 'Frontend Developer',
          category: 'Technology',
        },
        url: '/jobs/job-123',
        referrer: 'https://google.com',
      }

      const mockAnalyticsEvent = {
        id: 'analytics-123',
        event: eventData.event,
        userId: session.user.id,
        properties: eventData.properties,
        url: eventData.url,
        referer: eventData.referrer,
        createdAt: new Date(),
      }

      mockPrisma.analyticsEvent.create.mockResolvedValue(mockAnalyticsEvent)

      const request = createTestRequest('POST', '/api/analytics/track', eventData)
      const response = await trackAnalytics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: eventData.event,
          userId: session.user.id,
          properties: eventData.properties,
          url: eventData.url,
          referer: eventData.referrer,
        }),
      })
    })

    it('should track anonymous events', async () => {
      mockAuthSession(null) // No session

      const eventData = {
        event: 'page_view',
        properties: {
          page: '/jobs',
        },
        url: '/jobs',
      }

      const mockAnalyticsEvent = {
        id: 'analytics-anonymous',
        event: eventData.event,
        userId: null,
        properties: eventData.properties,
        url: eventData.url,
        createdAt: new Date(),
      }

      mockPrisma.analyticsEvent.create.mockResolvedValue(mockAnalyticsEvent)

      const request = createTestRequest('POST', '/api/analytics/track', eventData)
      const response = await trackAnalytics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)

      expect(mockPrisma.analyticsEvent.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          event: eventData.event,
          userId: null,
          properties: eventData.properties,
        }),
      })
    })

    it('should validate event data', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const invalidEventData = {
        // Missing required event field
        properties: {},
      }

      const request = createTestRequest('POST', '/api/analytics/track', invalidEventData)
      const response = await trackAnalytics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('Event name is required')
    })

    it('should handle database errors gracefully', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const eventData = {
        event: 'test_event',
        properties: {},
      }

      mockPrisma.analyticsEvent.create.mockRejectedValue(
        new Error('Database connection failed')
      )

      const request = createTestRequest('POST', '/api/analytics/track', eventData)
      const response = await trackAnalytics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to track event')
    })

    it('should sanitize event properties', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const eventData = {
        event: 'job_viewed',
        properties: {
          jobTitle: '<script>alert("xss")</script>Frontend Developer',
          description: 'Safe description<img src="x" onerror="alert(1)">',
        },
      }

      mockPrisma.analyticsEvent.create.mockResolvedValue({
        id: 'analytics-123',
        event: eventData.event,
        userId: session.user.id,
        properties: eventData.properties,
        createdAt: new Date(),
      })

      const request = createTestRequest('POST', '/api/analytics/track', eventData)
      const response = await trackAnalytics(request)

      expect(response.status).toBe(200)

      // Verify that properties were sanitized
      const createCall = mockPrisma.analyticsEvent.create.mock.calls[0][0]
      expect(createCall.data.properties.jobTitle).not.toContain('<script>')
      expect(createCall.data.properties.description).not.toContain('<img')
    })
  })

  describe('GET /api/admin/security', () => {
    it('should return security metrics for admin users', async () => {
      const adminSession = createTestSession({
        ...testData.user,
        role: 'ADMIN',
      })
      mockAuthSession(adminSession)

      const mockSecurityEvents = [
        {
          type: 'SUSPICIOUS_ACTIVITY',
          severity: 'HIGH',
          createdAt: new Date(),
        },
        {
          type: 'RATE_LIMIT_EXCEEDED',
          severity: 'MEDIUM',
          createdAt: new Date(),
        },
      ]

      const mockMetrics = {
        totalRequests: 10000,
        blockedRequests: 150,
        rateLimitedRequests: 75,
        suspiciousActivity: 25,
        authFailures: 50,
      }

      mockPrisma.securityEvent.findMany.mockResolvedValue(mockSecurityEvents)
      mockPrisma.securityEvent.count.mockResolvedValueOnce(150) // blocked
      mockPrisma.securityEvent.count.mockResolvedValueOnce(75)  // rate limited
      mockPrisma.securityEvent.count.mockResolvedValueOnce(25)  // suspicious
      mockPrisma.securityEvent.count.mockResolvedValueOnce(50)  // auth failures

      const request = createTestRequest('GET', '/api/admin/security')
      const response = await getSecurityMetrics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.metrics.blockedRequests).toBe(150)
      expect(data.metrics.rateLimitedRequests).toBe(75)
      expect(data.metrics.suspiciousActivity).toBe(25)
      expect(data.alerts).toHaveLength(2)

      expect(mockPrisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: expect.any(Date),
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        })
      )
    })

    it('should require admin role', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const request = createTestRequest('GET', '/api/admin/security')
      const response = await getSecurityMetrics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Admin access required')
    })

    it('should require authentication', async () => {
      mockAuthSession(null)

      const request = createTestRequest('GET', '/api/admin/security')
      const response = await getSecurityMetrics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })

    it('should handle database errors', async () => {
      const adminSession = createTestSession({
        ...testData.user,
        role: 'ADMIN',
      })
      mockAuthSession(adminSession)

      mockPrisma.securityEvent.findMany.mockRejectedValue(
        new Error('Database query failed')
      )

      const request = createTestRequest('GET', '/api/admin/security')
      const response = await getSecurityMetrics(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to fetch security metrics')
    })

    it('should filter events by date range', async () => {
      const adminSession = createTestSession({
        ...testData.user,
        role: 'ADMIN',
      })
      mockAuthSession(adminSession)

      mockPrisma.securityEvent.findMany.mockResolvedValue([])
      mockPrisma.securityEvent.count.mockResolvedValue(0)

      const request = createTestRequest('GET', '/api/admin/security?days=7')
      const response = await getSecurityMetrics(request)

      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      expect(mockPrisma.securityEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: expect.any(Date),
            },
          },
        })
      )
    })
  })

  describe('POST /api/upload', () => {
    it('should upload file successfully', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const mockUploadResult = {
        public_id: 'test-upload-123',
        secure_url: 'https://res.cloudinary.com/test/image/upload/test-upload-123.jpg',
        format: 'jpg',
        bytes: 1024,
      }

      mockCloudinaryUpload.mockResolvedValue(mockUploadResult)

      // Mock FormData and File
      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('type', 'avatar')

      const request = createTestRequest('POST', '/api/upload')
      // Mock formData method
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await uploadFile(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.url).toBe(mockUploadResult.secure_url)
      expect(data.publicId).toBe(mockUploadResult.public_id)

      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        expect.any(String), // base64 data
        expect.objectContaining({
          folder: 'hireoverseas/avatars',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
          max_file_size: 5000000, // 5MB
        })
      )
    })

    it('should require authentication', async () => {
      mockAuthSession(null)

      const request = createTestRequest('POST', '/api/upload')
      const response = await uploadFile(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })

    it('should validate file type', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const mockFile = new File(['test content'], 'test.exe', { type: 'application/exe' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('type', 'avatar')

      const request = createTestRequest('POST', '/api/upload')
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await uploadFile(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })

    it('should validate file size', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      // Create a mock file that's too large
      const largeContent = 'x'.repeat(6 * 1024 * 1024) // 6MB
      const mockFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('type', 'avatar')

      const request = createTestRequest('POST', '/api/upload')
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await uploadFile(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('File too large')
    })

    it('should handle different upload types', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      const mockUploadResult = {
        public_id: 'test-resume-123',
        secure_url: 'https://res.cloudinary.com/test/raw/upload/test-resume-123.pdf',
        format: 'pdf',
        bytes: 2048,
      }

      mockCloudinaryUpload.mockResolvedValue(mockUploadResult)

      const mockFile = new File(['resume content'], 'resume.pdf', { type: 'application/pdf' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('type', 'resume')

      const request = createTestRequest('POST', '/api/upload')
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await uploadFile(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(mockCloudinaryUpload).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          folder: 'hireoverseas/resumes',
          allowed_formats: ['pdf', 'doc', 'docx'],
        })
      )
    })

    it('should handle Cloudinary upload errors', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      mockCloudinaryUpload.mockRejectedValue(
        new Error('Cloudinary upload failed')
      )

      const mockFile = new File(['test content'], 'test.jpg', { type: 'image/jpeg' })
      const formData = new FormData()
      formData.append('file', mockFile)
      formData.append('type', 'avatar')

      const request = createTestRequest('POST', '/api/upload')
      request.formData = jest.fn().mockResolvedValue(formData)

      const response = await uploadFile(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(500)
      expect(data.error).toContain('Upload failed')
    })
  })
})