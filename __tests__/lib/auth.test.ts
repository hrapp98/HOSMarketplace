// Authentication logic tests
import { validateEmail, validatePassword, hashPassword, comparePassword } from '@/lib/auth'
import bcrypt from 'bcryptjs'

// Mock bcrypt
jest.mock('bcryptjs')
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>

describe('Auth Utilities', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ]

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid',
        'invalid@',
        '@invalid.com',
        'invalid@.com',
        'invalid.com',
        'inv alid@example.com',
        '',
        'test@',
        '@test.com',
      ]

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })

  describe('validatePassword', () => {
    it('should accept strong passwords', () => {
      const strongPasswords = [
        'SecureP@ss123',
        'MyStr0ng!Pass',
        'C0mpl3x#Password',
        'Abcd123!@#',
      ]

      strongPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(true)
      })
    })

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'password', // no uppercase, numbers, or special chars
        'PASSWORD', // no lowercase, numbers, or special chars
        '12345678', // no letters or special chars
        'Pass123', // too short
        'password123', // no uppercase or special chars
        'PASSWORD123', // no lowercase or special chars
        'Password!', // too short
        '', // empty
        'abc', // too short
      ]

      weakPasswords.forEach(password => {
        expect(validatePassword(password)).toBe(false)
      })
    })
  })

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123!'
      const hashedPassword = 'hashedPassword123'
      
      mockBcrypt.hash.mockResolvedValue(hashedPassword)

      const result = await hashPassword(password)

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12)
      expect(result).toBe(hashedPassword)
    })

    it('should throw an error if hashing fails', async () => {
      const password = 'testPassword123!'
      const error = new Error('Hashing failed')
      
      mockBcrypt.hash.mockRejectedValue(error)

      await expect(hashPassword(password)).rejects.toThrow('Hashing failed')
    })
  })

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const password = 'testPassword123!'
      const hashedPassword = 'hashedPassword123'
      
      mockBcrypt.compare.mockResolvedValue(true)

      const result = await comparePassword(password, hashedPassword)

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(true)
    })

    it('should return false for non-matching passwords', async () => {
      const password = 'testPassword123!'
      const hashedPassword = 'hashedPassword123'
      
      mockBcrypt.compare.mockResolvedValue(false)

      const result = await comparePassword(password, hashedPassword)

      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, hashedPassword)
      expect(result).toBe(false)
    })

    it('should throw an error if comparison fails', async () => {
      const password = 'testPassword123!'
      const hashedPassword = 'hashedPassword123'
      const error = new Error('Comparison failed')
      
      mockBcrypt.compare.mockRejectedValue(error)

      await expect(comparePassword(password, hashedPassword)).rejects.toThrow('Comparison failed')
    })
  })
})