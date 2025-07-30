// Jobs API integration tests
import { GET, POST } from '@/app/api/jobs/route'
import { GET as getJobById, PUT, DELETE } from '@/app/api/jobs/[id]/route'
import { POST as applyToJob } from '@/app/api/jobs/[id]/apply/route'
import { 
  createTestRequest, 
  createTestSession,
  extractResponseData, 
  mockAuthSession,
  mockPrisma,
  testData 
} from './setup'

describe('/api/jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/jobs', () => {
    it('should return paginated jobs list', async () => {
      const mockJobs = [
        { ...testData.job, id: 'job-1' },
        { ...testData.job, id: 'job-2', title: 'Backend Developer' },
      ]

      mockPrisma.job.findMany.mockResolvedValue(mockJobs)
      mockPrisma.job.count.mockResolvedValue(2)

      const request = createTestRequest('GET', '/api/jobs?page=1&limit=10')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.jobs).toHaveLength(2)
      expect(data.total).toBe(2)
      expect(data.page).toBe(1)
      expect(data.totalPages).toBe(1)

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'ACTIVE' },
          include: expect.any(Object),
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 10,
        })
      )
    })

    it('should filter jobs by search query', async () => {
      const filteredJobs = [{ ...testData.job, title: 'React Developer' }]

      mockPrisma.job.findMany.mockResolvedValue(filteredJobs)
      mockPrisma.job.count.mockResolvedValue(1)

      const request = createTestRequest('GET', '/api/jobs?search=React')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.jobs).toHaveLength(1)

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                OR: expect.arrayContaining([
                  { title: { contains: 'React', mode: 'insensitive' } },
                  { description: { contains: 'React', mode: 'insensitive' } },
                ])
              })
            ])
          })
        })
      )
    })

    it('should filter jobs by skills', async () => {
      const filteredJobs = [testData.job]

      mockPrisma.job.findMany.mockResolvedValue(filteredJobs)
      mockPrisma.job.count.mockResolvedValue(1)

      const request = createTestRequest('GET', '/api/jobs?skills=React,TypeScript')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              expect.objectContaining({
                skills: {
                  some: {
                    skill: {
                      name: { in: ['React', 'TypeScript'] }
                    }
                  }
                }
              })
            ])
          })
        })
      )
    })

    it('should filter jobs by employment type', async () => {
      const request = createTestRequest('GET', '/api/jobs?employmentType=FULL_TIME')
      const response = await GET(request)

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { employmentType: 'FULL_TIME' }
            ])
          })
        })
      )
    })

    it('should filter remote jobs', async () => {
      const request = createTestRequest('GET', '/api/jobs?remote=true')
      const response = await GET(request)

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              { isRemote: true }
            ])
          })
        })
      )
    })

    it('should handle pagination correctly', async () => {
      mockPrisma.job.findMany.mockResolvedValue([])
      mockPrisma.job.count.mockResolvedValue(25)

      const request = createTestRequest('GET', '/api/jobs?page=3&limit=10')
      const response = await GET(request)
      const data = await extractResponseData(response)

      expect(data.page).toBe(3)
      expect(data.totalPages).toBe(3)
      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3-1) * 10
          take: 10,
        })
      )
    })
  })

  describe('POST /api/jobs', () => {
    it('should create a new job as employer', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const jobData = {
        title: 'Senior Frontend Developer',
        description: 'Looking for an experienced React developer',
        employmentType: 'FULL_TIME',
        experienceLevel: 'SENIOR',
        isRemote: true,
        salaryMin: 80000,
        salaryMax: 120000,
        currency: 'USD',
        skills: ['React', 'TypeScript', 'Node.js'],
      }

      const createdJob = { ...testData.job, ...jobData, id: 'new-job-id' }
      mockPrisma.job.create.mockResolvedValue(createdJob)

      const request = createTestRequest('POST', '/api/jobs', jobData)
      const response = await POST(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.job.title).toBe(jobData.title)

      expect(mockPrisma.job.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            title: jobData.title,
            description: jobData.description,
            employerId: employerSession.user.id,
            status: 'DRAFT',
          })
        })
      )
    })

    it('should reject job creation for non-employers', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const jobData = {
        title: 'Frontend Developer',
        description: 'Job description',
      }

      const request = createTestRequest('POST', '/api/jobs', jobData)
      const response = await POST(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Only employers can create jobs')
    })

    it('should require authentication', async () => {
      mockAuthSession(null) // No session

      const jobData = {
        title: 'Frontend Developer',
        description: 'Job description',
      }

      const request = createTestRequest('POST', '/api/jobs', jobData)
      const response = await POST(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })

    it('should validate required fields', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const invalidJobData = {
        title: '', // Empty title
        // Missing description
        salaryMin: -1000, // Invalid salary
      }

      const request = createTestRequest('POST', '/api/jobs', invalidJobData)
      const response = await POST(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should validate salary range', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const invalidJobData = {
        title: 'Developer',
        description: 'Job description',
        salaryMin: 100000,
        salaryMax: 50000, // Max less than min
      }

      const request = createTestRequest('POST', '/api/jobs', invalidJobData)
      const response = await POST(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('salary range')
    })
  })

  describe('GET /api/jobs/[id]', () => {
    it('should return job details', async () => {
      const jobWithDetails = {
        ...testData.job,
        employer: testData.employer,
        applications: [],
        _count: { applications: 0 },
      }

      mockPrisma.job.findUnique.mockResolvedValue(jobWithDetails)

      const request = createTestRequest('GET', `/api/jobs/${testData.job.id}`)
      const response = await getJobById(request, { params: { id: testData.job.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.id).toBe(testData.job.id)
      expect(data.title).toBe(testData.job.title)

      expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: testData.job.id },
        include: expect.any(Object),
      })
    })

    it('should return 404 for non-existent job', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null)

      const request = createTestRequest('GET', '/api/jobs/non-existent')
      const response = await getJobById(request, { params: { id: 'non-existent' } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(404)
      expect(data.error).toContain('Job not found')
    })
  })

  describe('POST /api/jobs/[id]/apply', () => {
    it('should allow freelancer to apply to job', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const applicationData = {
        coverLetter: 'I am very interested in this position and believe my skills make me a great candidate.',
        proposedRate: 75,
      }

      const job = { ...testData.job, status: 'ACTIVE' }
      const createdApplication = {
        ...testData.application,
        ...applicationData,
        id: 'new-app-id',
      }

      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findFirst.mockResolvedValue(null) // No existing application
      mockPrisma.application.create.mockResolvedValue(createdApplication)

      const request = createTestRequest('POST', `/api/jobs/${testData.job.id}/apply`, applicationData)
      const response = await applyToJob(request, { params: { id: testData.job.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.application.coverLetter).toBe(applicationData.coverLetter)

      expect(mockPrisma.application.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            jobId: testData.job.id,
            applicantId: freelancerSession.user.id,
            coverLetter: applicationData.coverLetter,
            proposedRate: applicationData.proposedRate,
          })
        })
      )
    })

    it('should prevent duplicate applications', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const job = { ...testData.job, status: 'ACTIVE' }
      const existingApplication = testData.application

      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findFirst.mockResolvedValue(existingApplication)

      const applicationData = {
        coverLetter: 'I want to apply again',
        proposedRate: 80,
      }

      const request = createTestRequest('POST', `/api/jobs/${testData.job.id}/apply`, applicationData)
      const response = await applyToJob(request, { params: { id: testData.job.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('already applied')
    })

    it('should reject applications from employers', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const applicationData = {
        coverLetter: 'I want to apply',
        proposedRate: 75,
      }

      const request = createTestRequest('POST', `/api/jobs/${testData.job.id}/apply`, applicationData)
      const response = await applyToJob(request, { params: { id: testData.job.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Only freelancers can apply')
    })

    it('should validate application data', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const job = { ...testData.job, status: 'ACTIVE' }
      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findFirst.mockResolvedValue(null)

      const invalidApplicationData = {
        coverLetter: 'Too short', // Less than minimum length
        proposedRate: 0, // Invalid rate
      }

      const request = createTestRequest('POST', `/api/jobs/${testData.job.id}/apply`, invalidApplicationData)
      const response = await applyToJob(request, { params: { id: testData.job.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toBeDefined()
    })

    it('should prevent applications to inactive jobs', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const inactiveJob = { ...testData.job, status: 'CLOSED' }
      mockPrisma.job.findUnique.mockResolvedValue(inactiveJob)

      const applicationData = {
        coverLetter: 'I want to apply to this closed job',
        proposedRate: 75,
      }

      const request = createTestRequest('POST', `/api/jobs/${testData.job.id}/apply`, applicationData)
      const response = await applyToJob(request, { params: { id: testData.job.id } })
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('not accepting applications')
    })
  })
})