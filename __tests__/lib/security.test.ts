// Security utilities tests
import { 
  sanitizeInput, 
  validateInput, 
  detectSuspiciousActivity,
  logSecurityEvent,
  SECURITY_PATTERNS 
} from '@/lib/security'
import { prisma } from '@/app/lib/prisma'

const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Security Utilities', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const result = sanitizeInput(input)
      expect(result).toBe('Hello World')
    })

    it('should remove JavaScript protocols', () => {
      const input = 'javascript:alert("xss")'
      const result = sanitizeInput(input)
      expect(result).toBe('')
    })

    it('should preserve safe content', () => {
      const input = 'This is a safe string with numbers 123 and symbols !@#'
      const result = sanitizeInput(input)
      expect(result).toBe(input)
    })

    it('should handle empty strings', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null as any)).toBe('')
      expect(sanitizeInput(undefined as any)).toBe('')
    })

    it('should remove common XSS patterns', () => {
      const xssInputs = [
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:void(0)',
        'data:text/html,<script>alert(1)</script>',
        '<iframe src="javascript:alert(1)">',
      ]

      xssInputs.forEach(input => {
        const result = sanitizeInput(input)
        expect(result).not.toContain('<')
        expect(result).not.toContain('javascript:')
        expect(result).not.toContain('onerror')
        expect(result).not.toContain('onload')
      })
    })
  })

  describe('validateInput', () => {
    it('should validate email format', () => {
      expect(validateInput('test@example.com', 'email')).toBe(true)
      expect(validateInput('invalid-email', 'email')).toBe(false)
      expect(validateInput('', 'email')).toBe(false)
    })

    it('should validate phone numbers', () => {
      expect(validateInput('+1234567890', 'phone')).toBe(true)
      expect(validateInput('1234567890', 'phone')).toBe(true)
      expect(validateInput('123-456-7890', 'phone')).toBe(true)
      expect(validateInput('invalid-phone', 'phone')).toBe(false)
      expect(validateInput('123', 'phone')).toBe(false)
    })

    it('should validate URLs', () => {
      expect(validateInput('https://example.com', 'url')).toBe(true)
      expect(validateInput('http://example.com', 'url')).toBe(true)
      expect(validateInput('ftp://example.com', 'url')).toBe(true)
      expect(validateInput('invalid-url', 'url')).toBe(false)
      expect(validateInput('javascript:alert(1)', 'url')).toBe(false)
    })

    it('should validate alphanumeric strings', () => {
      expect(validateInput('abc123', 'alphanumeric')).toBe(true)
      expect(validateInput('ABC123', 'alphanumeric')).toBe(true)
      expect(validateInput('special!@#', 'alphanumeric')).toBe(false)
      expect(validateInput('', 'alphanumeric')).toBe(false)
    })

    it('should validate text with allowed characters', () => {
      expect(validateInput('Hello World!', 'text')).toBe(true)
      expect(validateInput('Text with numbers 123', 'text')).toBe(true)
      expect(validateInput('<script>alert(1)</script>', 'text')).toBe(false)
      expect(validateInput('javascript:void(0)', 'text')).toBe(false)
    })
  })

  describe('detectSuspiciousActivity', () => {
    const mockRequest = {
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: { username: 'test', password: 'password123' },
      url: '/api/auth/signin',
      method: 'POST',
    }

    it('should detect SQL injection attempts', () => {
      const maliciousRequest = {
        ...mockRequest,
        body: { username: "admin'; DROP TABLE users; --", password: 'password' },
      }

      const result = detectSuspiciousActivity(maliciousRequest)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('SQL injection pattern detected')
      expect(result.severity).toBe('HIGH')
    })

    it('should detect XSS attempts', () => {
      const maliciousRequest = {
        ...mockRequest,
        body: { comment: '<script>alert("xss")</script>' },
      }

      const result = detectSuspiciousActivity(maliciousRequest)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('XSS pattern detected')
      expect(result.severity).toBe('HIGH')
    })

    it('should detect suspicious user agents', () => {
      const maliciousRequest = {
        ...mockRequest,
        headers: { 'user-agent': 'sqlmap/1.0' },
      }

      const result = detectSuspiciousActivity(maliciousRequest)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Suspicious user agent')
      expect(result.severity).toBe('MEDIUM')
    })

    it('should detect path traversal attempts', () => {
      const maliciousRequest = {
        ...mockRequest,
        url: '/api/files/../../etc/passwd',
      }

      const result = detectSuspiciousActivity(maliciousRequest)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Path traversal pattern detected')
      expect(result.severity).toBe('HIGH')
    })

    it('should detect command injection attempts', () => {
      const maliciousRequest = {
        ...mockRequest,
        body: { filename: 'file.txt; rm -rf /' },
      }

      const result = detectSuspiciousActivity(maliciousRequest)
      expect(result.isSuspicious).toBe(true)
      expect(result.reasons).toContain('Command injection pattern detected')
      expect(result.severity).toBe('HIGH')
    })

    it('should allow legitimate requests', () => {
      const legitimateRequest = {
        ...mockRequest,
        body: { 
          title: 'Frontend Developer Position',
          description: 'Looking for a skilled React developer with 3+ years experience.',
          skills: ['React', 'TypeScript', 'Node.js'],
        },
      }

      const result = detectSuspiciousActivity(legitimateRequest)
      expect(result.isSuspicious).toBe(false)
      expect(result.reasons).toEqual([])
      expect(result.severity).toBe('LOW')
    })

    it('should handle missing request data gracefully', () => {
      const incompleteRequest = {
        ip: '192.168.1.1',
      }

      const result = detectSuspiciousActivity(incompleteRequest as any)
      expect(result.isSuspicious).toBe(false)
      expect(result.severity).toBe('LOW')
    })
  })

  describe('logSecurityEvent', () => {
    it('should log security events to database', async () => {
      const eventData = {
        type: 'SUSPICIOUS_ACTIVITY',
        severity: 'HIGH' as const,
        description: 'SQL injection attempt detected',
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        userId: 'user-123',
        details: { pattern: 'DROP TABLE', url: '/api/users' },
      }

      const mockSecurityEvent = {
        id: 'event-123',
        ...eventData,
        createdAt: new Date(),
      }

      mockPrisma.securityEvent.create.mockResolvedValue(mockSecurityEvent as any)

      const result = await logSecurityEvent(eventData)

      expect(mockPrisma.securityEvent.create).toHaveBeenCalledWith({
        data: eventData,
      })

      expect(result).toEqual(mockSecurityEvent)
    })

    it('should handle database errors gracefully', async () => {
      const eventData = {
        type: 'AUTHENTICATION_FAILURE',
        severity: 'MEDIUM' as const,
        description: 'Failed login attempt',
        ip: '192.168.1.1',
      }

      const error = new Error('Database connection failed')
      mockPrisma.securityEvent.create.mockRejectedValue(error)

      await expect(logSecurityEvent(eventData)).rejects.toThrow('Database connection failed')
    })
  })

  describe('SECURITY_PATTERNS', () => {
    it('should have all required security patterns', () => {
      expect(SECURITY_PATTERNS.SQL_INJECTION).toBeDefined()
      expect(SECURITY_PATTERNS.XSS).toBeDefined()
      expect(SECURITY_PATTERNS.PATH_TRAVERSAL).toBeDefined()
      expect(SECURITY_PATTERNS.COMMAND_INJECTION).toBeDefined()
      expect(SECURITY_PATTERNS.SUSPICIOUS_USER_AGENTS).toBeDefined()
    })

    it('should detect common SQL injection patterns', () => {
      const sqlInjectionTests = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "1' UNION SELECT * FROM users--",
        "'; INSERT INTO users VALUES ('admin', 'password'); --",
      ]

      sqlInjectionTests.forEach(test => {
        expect(SECURITY_PATTERNS.SQL_INJECTION.test(test)).toBe(true)
      })
    })

    it('should detect common XSS patterns', () => {
      const xssTests = [
        '<script>alert("xss")</script>',
        '<img src="x" onerror="alert(1)">',
        '<svg onload="alert(1)">',
        'javascript:alert(1)',
      ]

      xssTests.forEach(test => {
        expect(SECURITY_PATTERNS.XSS.test(test)).toBe(true)
      })
    })
  })
})