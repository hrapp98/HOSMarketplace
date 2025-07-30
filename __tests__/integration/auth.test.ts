// Authentication API integration tests
import { POST } from '@/app/api/auth/register/route'
import { 
  createTestRequest, 
  extractResponseData, 
  mockAuthSession,
  mockPrisma,
  testData 
} from './setup'

describe('/api/auth/register', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should register a new freelancer successfully', async () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'SecureP@ss123',
      role: 'FREELANCER',
      firstName: 'John',
      lastName: 'Doe',
      country: 'US',
    }

    const newUser = {
      id: 'new-user-id',
      email: registerData.email,
      role: registerData.role,
      profile: {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        country: registerData.country,
      },
    }

    mockPrisma.user.findUnique.mockResolvedValue(null) // User doesn't exist
    mockPrisma.user.create.mockResolvedValue(newUser)

    const request = createTestRequest('POST', '/api/auth/register', registerData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.user.email).toBe(registerData.email)

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: registerData.email },
    })

    expect(mockPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: registerData.email,
          role: registerData.role,
        }),
      })
    )
  })

  it('should register a new employer successfully', async () => {
    const registerData = {
      email: 'employer@example.com',
      password: 'SecureP@ss123',
      role: 'EMPLOYER',
      firstName: 'Jane',
      lastName: 'Smith',
      companyName: 'Tech Corp',
    }

    const newUser = {
      id: 'new-employer-id',
      email: registerData.email,
      role: registerData.role,
      profile: {
        firstName: registerData.firstName,
        lastName: registerData.lastName,
      },
      employerProfile: {
        companyName: registerData.companyName,
      },
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue(newUser)

    const request = createTestRequest('POST', '/api/auth/register', registerData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.user.role).toBe('EMPLOYER')
  })

  it('should reject registration with existing email', async () => {
    const registerData = {
      email: 'existing@example.com',
      password: 'SecureP@ss123',
      role: 'FREELANCER',
      firstName: 'John',
      lastName: 'Doe',
    }

    mockPrisma.user.findUnique.mockResolvedValue(testData.user) // User exists

    const request = createTestRequest('POST', '/api/auth/register', registerData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('already exists')
  })

  it('should validate required fields', async () => {
    const invalidData = {
      email: 'invalid-email',
      password: '123', // Too short
      role: 'INVALID_ROLE',
    }

    const request = createTestRequest('POST', '/api/auth/register', invalidData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should validate email format', async () => {
    const invalidData = {
      email: 'not-an-email',
      password: 'SecureP@ss123',
      role: 'FREELANCER',
      firstName: 'John',
      lastName: 'Doe',
    }

    const request = createTestRequest('POST', '/api/auth/register', invalidData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('Invalid email')
  })

  it('should validate password strength', async () => {
    const weakPasswordData = {
      email: 'user@example.com',
      password: 'weak',
      role: 'FREELANCER',
      firstName: 'John',
      lastName: 'Doe',
    }

    const request = createTestRequest('POST', '/api/auth/register', weakPasswordData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('Password must be at least 8 characters')
  })

  it('should handle database errors gracefully', async () => {
    const registerData = {
      email: 'user@example.com',
      password: 'SecureP@ss123',
      role: 'FREELANCER',
      firstName: 'John',
      lastName: 'Doe',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockRejectedValue(new Error('Database connection failed'))

    const request = createTestRequest('POST', '/api/auth/register', registerData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(500)
    expect(data.error).toContain('registration failed')
  })

  it('should require all mandatory fields for freelancer', async () => {
    const incompleteData = {
      email: 'user@example.com',
      password: 'SecureP@ss123',
      role: 'FREELANCER',
      // Missing firstName, lastName
    }

    const request = createTestRequest('POST', '/api/auth/register', incompleteData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('required')
  })

  it('should require company name for employers', async () => {
    const incompleteEmployerData = {
      email: 'employer@example.com',
      password: 'SecureP@ss123',
      role: 'EMPLOYER',
      firstName: 'Jane',
      lastName: 'Smith',
      // Missing companyName
    }

    const request = createTestRequest('POST', '/api/auth/register', incompleteEmployerData)
    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toContain('Company name is required')
  })

  it('should handle invalid JSON in request body', async () => {
    const request = createTestRequest('POST', '/api/auth/register')
    // Override json method to throw error
    request.json = jest.fn().mockRejectedValue(new Error('Invalid JSON'))

    const response = await POST(request)
    const data = await extractResponseData(response)

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should sanitize input data', async () => {
    const maliciousData = {
      email: 'user@example.com',
      password: 'SecureP@ss123',
      role: 'FREELANCER',
      firstName: '<script>alert("xss")</script>John',
      lastName: 'Doe<img src="x" onerror="alert(1)">',
    }

    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.create.mockResolvedValue({
      id: 'user-id',
      email: maliciousData.email,
      role: maliciousData.role,
    })

    const request = createTestRequest('POST', '/api/auth/register', maliciousData)
    const response = await POST(request)

    expect(response.status).toBe(201)
    
    // Verify that the create call had sanitized data
    const createCall = mockPrisma.user.create.mock.calls[0][0]
    expect(createCall.data.profile.create.firstName).not.toContain('<script>')
    expect(createCall.data.profile.create.lastName).not.toContain('<img')
  })
})