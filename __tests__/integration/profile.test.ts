// Profile API integration tests
import { GET, PUT } from '@/app/api/profile/route'
import { GET as getApplications } from '@/app/api/freelancer/applications/route'
import { PUT as updateApplicationStatus } from '@/app/api/employer/applications/[id]/status/route'
import { 
  createTestRequest, 
  createTestSession,
  extractResponseData, 
  mockAuthSession,
  mockPrisma,
  testData 
} from './setup'

describe('/api/profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/profile', () => {
    it('should return freelancer profile', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const userWithProfile = {
        ...testData.user,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          country: 'US',
          avatar: null,
        },
        freelancerProfile: {
          title: 'Frontend Developer',
          bio: 'Experienced React developer',
          hourlyRate: 75,
          skills: [
            { skill: { name: 'React' } },
            { skill: { name: 'TypeScript' } },
          ],
        },
      }

      mockPrisma.user.findUnique.mockResolvedValue(userWithProfile)

      const request = createTestRequest('GET', '/api/profile')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.id).toBe(testData.user.id)
      expect(data.email).toBe(testData.user.email)
      expect(data.profile.firstName).toBe('John')
      expect(data.freelancerProfile.title).toBe('Frontend Developer')

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: freelancerSession.user.id },
        include: expect.objectContaining({
          profile: true,
          freelancerProfile: expect.any(Object),
        }),
      })
    })

    it('should return employer profile', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const employerWithProfile = {
        ...testData.employer,
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
        },
        employerProfile: {
          companyName: 'Tech Corp',
          companySize: '10-50',
          website: 'https://techcorp.com',
        },
      }

      mockPrisma.user.findUnique.mockResolvedValue(employerWithProfile)

      const request = createTestRequest('GET', '/api/profile')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.role).toBe('EMPLOYER')
      expect(data.employerProfile.companyName).toBe('Tech Corp')
    })

    it('should require authentication', async () => {
      mockAuthSession(null)

      const request = createTestRequest('GET', '/api/profile')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })

    it('should handle non-existent user', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      mockPrisma.user.findUnique.mockResolvedValue(null)

      const request = createTestRequest('GET', '/api/profile')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(404)
      expect(data.error).toContain('User not found')
    })
  })

  describe('PUT /api/profile', () => {
    it('should update freelancer profile', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const updateData = {
        profile: {
          firstName: 'John Updated',
          lastName: 'Doe Updated',
          bio: 'Updated bio',
        },
        freelancerProfile: {
          title: 'Senior Frontend Developer',
          hourlyRate: 85,
          skills: ['React', 'TypeScript', 'Next.js'],
        },
      }

      const existingUser = {
        ...testData.user,
        profile: { firstName: 'John', lastName: 'Doe' },
        freelancerProfile: { title: 'Frontend Developer', hourlyRate: 75 },
      }

      const updatedUser = {
        ...existingUser,
        profile: updateData.profile,
        freelancerProfile: updateData.freelancerProfile,
      }

      mockPrisma.user.findUnique.mockResolvedValue(existingUser)
      mockPrisma.user.update.mockResolvedValue(updatedUser)

      const request = createTestRequest('PUT', '/api/profile', updateData)
      const response = await PUT(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.profile.firstName).toBe('John Updated')

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: freelancerSession.user.id },
          data: expect.objectContaining({
            profile: expect.objectContaining({
              update: expect.objectContaining({
                firstName: 'John Updated',
                lastName: 'Doe Updated',
              }),
            }),
          }),
        })
      )
    })

    it('should update employer profile', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const updateData = {
        profile: {
          firstName: 'Jane Updated',
          lastName: 'Smith Updated',
        },
        employerProfile: {
          companyName: 'Updated Tech Corp',
          companySize: '50-100',
          website: 'https://updated-techcorp.com',
        },
      }

      const existingEmployer = {
        ...testData.employer,
        profile: { firstName: 'Jane', lastName: 'Smith' },
        employerProfile: { companyName: 'Tech Corp' },
      }

      const updatedEmployer = {
        ...existingEmployer,
        profile: updateData.profile,
        employerProfile: updateData.employerProfile,
      }

      mockPrisma.user.findUnique.mockResolvedValue(existingEmployer)
      mockPrisma.user.update.mockResolvedValue(updatedEmployer)

      const request = createTestRequest('PUT', '/api/profile', updateData)
      const response = await PUT(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.user.employerProfile.companyName).toBe('Updated Tech Corp')
    })

    it('should validate required fields', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const invalidUpdateData = {
        profile: {
          firstName: '', // Empty name
          email: 'invalid-email', // Invalid email format
        },
        freelancerProfile: {
          hourlyRate: -10, // Invalid rate
        },
      }

      const request = createTestRequest('PUT', '/api/profile', invalidUpdateData)
      const response = await PUT(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should sanitize input data', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const maliciousUpdateData = {
        profile: {
          firstName: '<script>alert("xss")</script>Safe Name',
          bio: 'Normal bio<img src="x" onerror="alert(1)">',
        },
        freelancerProfile: {
          title: 'Developer<script>malicious()</script>',
        },
      }

      const existingUser = { ...testData.user }
      mockPrisma.user.findUnique.mockResolvedValue(existingUser)
      mockPrisma.user.update.mockResolvedValue(existingUser)

      const request = createTestRequest('PUT', '/api/profile', maliciousUpdateData)
      const response = await PUT(request)

      expect(response.status).toBe(200)

      // Verify that the update call had sanitized data
      const updateCall = mockPrisma.user.update.mock.calls[0][0]
      expect(updateCall.data.profile.update.firstName).not.toContain('<script>')
      expect(updateCall.data.profile.update.bio).not.toContain('<img')
    })

    it('should prevent updating other users profiles', async () => {
      const session = createTestSession(testData.user)
      mockAuthSession(session)

      // Mock finding a different user
      const differentUser = {
        ...testData.user,
        id: 'different-user-id',
      }

      mockPrisma.user.findUnique.mockResolvedValue(differentUser)

      const updateData = {
        profile: { firstName: 'Hacker' },
      }

      const request = createTestRequest('PUT', '/api/profile', updateData)
      const response = await PUT(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('not authorized')
    })
  })

  describe('GET /api/freelancer/applications', () => {
    it('should return freelancer applications', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const mockApplications = [
        {
          ...testData.application,
          id: 'app-1',
          status: 'PENDING',
          job: {
            title: 'Frontend Developer',
            employer: {
              profile: { firstName: 'Jane', lastName: 'Smith' },
              employerProfile: { companyName: 'Tech Corp' },
            },
          },
        },
        {
          ...testData.application,
          id: 'app-2',
          status: 'ACCEPTED',
          job: {
            title: 'Backend Developer',
            employer: {
              profile: { firstName: 'John', lastName: 'Doe' },
              employerProfile: { companyName: 'Dev Corp' },
            },
          },
        },
      ]

      mockPrisma.application.findMany.mockResolvedValue(mockApplications)
      mockPrisma.application.count.mockResolvedValue(2)

      const request = createTestRequest('GET', '/api/freelancer/applications')
      const response = await getApplications(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.applications).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.applications[0].job.title).toBe('Frontend Developer')

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { applicantId: freelancerSession.user.id },
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('should filter applications by status', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      mockPrisma.application.findMany.mockResolvedValue([])
      mockPrisma.application.count.mockResolvedValue(0)

      const request = createTestRequest('GET', '/api/freelancer/applications?status=ACCEPTED')
      const response = await getApplications(request)

      expect(mockPrisma.application.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            applicantId: freelancerSession.user.id,
            status: 'ACCEPTED',
          },
        })
      )
    })

    it('should only return applications for authenticated freelancer', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const request = createTestRequest('GET', '/api/freelancer/applications')
      const response = await getApplications(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Only freelancers')
    })
  })

  describe('PUT /api/employer/applications/[id]/status', () => {
    it('should update application status as employer', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const statusUpdateData = {
        status: 'ACCEPTED',
        message: 'Congratulations! You have been selected for this position.',
      }

      const application = {
        ...testData.application,
        job: {
          ...testData.job,
          employerId: employerSession.user.id,
        },
        freelancer: testData.user,
      }

      const updatedApplication = {
        ...application,
        status: 'ACCEPTED',
        employerMessage: statusUpdateData.message,
      }

      mockPrisma.application.findUnique.mockResolvedValue(application)
      mockPrisma.application.update.mockResolvedValue(updatedApplication)

      const request = createTestRequest('PUT', `/api/employer/applications/${testData.application.id}/status`, statusUpdateData)
      const response = await updateApplicationStatus(request, { params: { id: testData.application.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.application.status).toBe('ACCEPTED')

      expect(mockPrisma.application.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: testData.application.id },
          data: {
            status: 'ACCEPTED',
            employerMessage: statusUpdateData.message,
          },
        })
      )
    })

    it('should prevent unauthorized status updates', async () => {
      const wrongEmployerSession = createTestSession({
        ...testData.employer,
        id: 'wrong-employer-id',
      })
      mockAuthSession(wrongEmployerSession)

      const application = {
        ...testData.application,
        job: {
          ...testData.job,
          employerId: 'different-employer-id',
        },
      }

      mockPrisma.application.findUnique.mockResolvedValue(application)

      const statusUpdateData = {
        status: 'ACCEPTED',
        message: 'You are hired!',
      }

      const request = createTestRequest('PUT', `/api/employer/applications/${testData.application.id}/status`, statusUpdateData)
      const response = await updateApplicationStatus(request, { params: { id: testData.application.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('not authorized')
    })

    it('should validate status values', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const application = {
        ...testData.application,
        job: {
          ...testData.job,
          employerId: employerSession.user.id,
        },
      }

      mockPrisma.application.findUnique.mockResolvedValue(application)

      const invalidStatusData = {
        status: 'INVALID_STATUS',
        message: 'Invalid status update',
      }

      const request = createTestRequest('PUT', `/api/employer/applications/${testData.application.id}/status`, invalidStatusData)
      const response = await updateApplicationStatus(request, { params: { id: testData.application.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid status')
    })

    it('should handle non-existent applications', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      mockPrisma.application.findUnique.mockResolvedValue(null)

      const statusUpdateData = {
        status: 'ACCEPTED',
        message: 'You are hired!',
      }

      const request = createTestRequest('PUT', '/api/employer/applications/non-existent/status', statusUpdateData)
      const response = await updateApplicationStatus(request, { params: { id: 'non-existent' } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(404)
      expect(data.error).toContain('Application not found')
    })
  })
})