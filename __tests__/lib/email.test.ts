// Email service tests
import { sendEmail, sendWelcomeEmail, sendJobApplicationEmail, sendApplicationStatusEmail } from '@/lib/email'
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'

// Mock nodemailer
jest.mock('nodemailer')
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>

// Mock React Email render
jest.mock('@react-email/render')
const mockRender = render as jest.Mock

describe('Email Service', () => {
  const mockTransporter = {
    sendMail: jest.fn(),
    verify: jest.fn(),
  }

  beforeEach(() => {
    jest.resetAllMocks()
    mockNodemailer.createTransport.mockReturnValue(mockTransporter as any)
    mockRender.mockReturnValue('<html>Mock Email</html>')
  })

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email</p>',
        text: 'Test email',
      }

      const result = await sendEmail(emailData)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email</p>',
        text: 'Test email',
      })

      expect(result).toEqual({ messageId: 'test-message-id' })
    })

    it('should handle email sending errors', async () => {
      const error = new Error('SMTP Error')
      mockTransporter.sendMail.mockRejectedValue(error)

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email</p>',
      }

      await expect(sendEmail(emailData)).rejects.toThrow('SMTP Error')
    })

    it('should use default text if not provided', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'test-message-id' })

      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email</p>',
      }

      await sendEmail(emailData)

      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email</p>',
        text: undefined,
      })
    })
  })

  describe('sendWelcomeEmail', () => {
    it('should send welcome email to new user', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'welcome-message-id' })

      const userData = {
        email: 'newuser@example.com',
        firstName: 'John',
        role: 'FREELANCER' as const,
      }

      const result = await sendWelcomeEmail(userData)

      expect(mockRender).toHaveBeenCalled()
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'newuser@example.com',
        subject: 'Welcome to HireOverseas!',
        html: '<html>Mock Email</html>',
        text: undefined,
      })

      expect(result).toEqual({ messageId: 'welcome-message-id' })
    })

    it('should handle different user roles', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'welcome-employer-id' })

      const employerData = {
        email: 'employer@example.com',
        firstName: 'Jane',
        role: 'EMPLOYER' as const,
      }

      await sendWelcomeEmail(employerData)

      expect(mockRender).toHaveBeenCalled()
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'employer@example.com',
          subject: 'Welcome to HireOverseas!',
        })
      )
    })
  })

  describe('sendJobApplicationEmail', () => {
    it('should send job application notification to employer', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'application-message-id' })

      const applicationData = {
        employerEmail: 'employer@example.com',
        employerName: 'Jane Smith',
        jobTitle: 'Frontend Developer',
        freelancerName: 'John Doe',
        coverLetter: 'I am interested in this position...',
        applicationId: 'app-123',
      }

      const result = await sendJobApplicationEmail(applicationData)

      expect(mockRender).toHaveBeenCalled()
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'employer@example.com',
        subject: 'New Application: Frontend Developer',
        html: '<html>Mock Email</html>',
        text: undefined,
      })

      expect(result).toEqual({ messageId: 'application-message-id' })
    })
  })

  describe('sendApplicationStatusEmail', () => {
    it('should send application status update to freelancer', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'status-message-id' })

      const statusData = {
        freelancerEmail: 'freelancer@example.com',
        freelancerName: 'John Doe',
        jobTitle: 'Frontend Developer',
        status: 'ACCEPTED' as const,
        employerName: 'Jane Smith',
        message: 'Congratulations! We would like to hire you.',
      }

      const result = await sendApplicationStatusEmail(statusData)

      expect(mockRender).toHaveBeenCalled()
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: process.env.EMAIL_FROM,
        to: 'freelancer@example.com',
        subject: 'Application Update: Frontend Developer',
        html: '<html>Mock Email</html>',
        text: undefined,
      })

      expect(result).toEqual({ messageId: 'status-message-id' })
    })

    it('should handle different status types', async () => {
      mockTransporter.sendMail.mockResolvedValue({ messageId: 'rejected-message-id' })

      const rejectionData = {
        freelancerEmail: 'freelancer@example.com',
        freelancerName: 'John Doe',
        jobTitle: 'Frontend Developer',
        status: 'REJECTED' as const,
        employerName: 'Jane Smith',
        message: 'Thank you for your application, but we have chosen another candidate.',
      }

      await sendApplicationStatusEmail(rejectionData)

      expect(mockRender).toHaveBeenCalled()
      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'freelancer@example.com',
          subject: 'Application Update: Frontend Developer',
        })
      )
    })
  })

  describe('transporter configuration', () => {
    it('should create transporter with correct configuration', () => {
      expect(mockNodemailer.createTransporter).toHaveBeenCalledWith({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      })
    })
  })
})