// Payments API integration tests
import { POST as createPaymentIntent } from '@/app/api/payments/create-payment-intent/route'
import { POST as confirmPayment } from '@/app/api/payments/confirm/route'
import { POST as createStripeAccount } from '@/app/api/freelancer/create-stripe-account/route'
import { 
  createTestRequest, 
  createTestSession,
  extractResponseData, 
  mockAuthSession,
  mockPrisma,
  testData 
} from './setup'
import Stripe from 'stripe'

// Mock Stripe
const mockStripe = {
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
  accountLinks: {
    create: jest.fn(),
  },
} as unknown as jest.Mocked<Stripe>

// Mock Stripe constructor
jest.mock('stripe', () => {
  return jest.fn(() => mockStripe)
})

describe('/api/payments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/payments/create-payment-intent', () => {
    it('should create payment intent for valid job', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const job = {
        ...testData.job,
        employer: testData.employer,
        applications: [
          {
            ...testData.application,
            freelancer: testData.user,
            status: 'ACCEPTED',
          },
        ],
      }

      const paymentData = {
        jobId: job.id,
        amount: 5000, // $50.00
        applicationId: testData.application.id,
      }

      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 5000,
        currency: 'usd',
        status: 'requires_payment_method',
      }

      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findUnique.mockResolvedValue(testData.application)
      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any)

      const request = createTestRequest('POST', '/api/payments/create-payment-intent', paymentData)
      const response = await createPaymentIntent(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.clientSecret).toBe(mockPaymentIntent.client_secret)
      expect(data.paymentIntentId).toBe(mockPaymentIntent.id)

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          currency: 'usd',
          metadata: expect.objectContaining({
            jobId: job.id,
            applicationId: testData.application.id,
          }),
        })
      )
    })

    it('should require authentication', async () => {
      mockAuthSession(null)

      const paymentData = {
        jobId: 'job-123',
        amount: 5000,
        applicationId: 'app-123',
      }

      const request = createTestRequest('POST', '/api/payments/create-payment-intent', paymentData)
      const response = await createPaymentIntent(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(401)
      expect(data.error).toContain('Authentication required')
    })

    it('should validate job ownership', async () => {
      const wrongEmployerSession = createTestSession({
        ...testData.employer,
        id: 'wrong-employer-id',
      })
      mockAuthSession(wrongEmployerSession)

      const job = {
        ...testData.job,
        employerId: 'different-employer-id',
      }

      mockPrisma.job.findUnique.mockResolvedValue(job)

      const paymentData = {
        jobId: job.id,
        amount: 5000,
        applicationId: 'app-123',
      }

      const request = createTestRequest('POST', '/api/payments/create-payment-intent', paymentData)
      const response = await createPaymentIntent(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('not authorized')
    })

    it('should validate minimum payment amount', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const job = { ...testData.job, employer: testData.employer }
      mockPrisma.job.findUnique.mockResolvedValue(job)

      const paymentData = {
        jobId: job.id,
        amount: 50, // Below minimum ($1.00)
        applicationId: 'app-123',
      }

      const request = createTestRequest('POST', '/api/payments/create-payment-intent', paymentData)
      const response = await createPaymentIntent(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('minimum amount')
    })

    it('should handle Stripe errors', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const job = { ...testData.job, employer: testData.employer }
      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findUnique.mockResolvedValue(testData.application)

      mockStripe.paymentIntents.create.mockRejectedValue(
        new Error('Your card was declined')
      )

      const paymentData = {
        jobId: job.id,
        amount: 5000,
        applicationId: 'app-123',
      }

      const request = createTestRequest('POST', '/api/payments/create-payment-intent', paymentData)
      const response = await createPaymentIntent(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(500)
      expect(data.error).toContain('payment intent creation failed')
    })
  })

  describe('POST /api/payments/confirm', () => {
    it('should confirm payment and create payment record', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const confirmData = {
        paymentIntentId: 'pi_test_123',
        jobId: testData.job.id,
        applicationId: testData.application.id,
      }

      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 5000,
        currency: 'usd',
        metadata: {
          jobId: testData.job.id,
          applicationId: testData.application.id,
        },
      }

      const mockPaymentRecord = {
        id: 'payment-123',
        amount: 5000,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_test_123',
        payerId: employerSession.user.id,
        recipientId: testData.user.id,
        jobId: testData.job.id,
      }

      const job = { ...testData.job, employer: testData.employer }
      const application = {
        ...testData.application,
        freelancer: testData.user,
      }

      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findUnique.mockResolvedValue(application)
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any)
      mockPrisma.payment.create.mockResolvedValue(mockPaymentRecord)

      const request = createTestRequest('POST', '/api/payments/confirm', confirmData)
      const response = await confirmPayment(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.payment.status).toBe('COMPLETED')

      expect(mockPrisma.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            amount: 5000,
            currency: 'USD',
            status: 'COMPLETED',
            stripePaymentId: 'pi_test_123',
            payerId: employerSession.user.id,
            recipientId: testData.user.id,
            jobId: testData.job.id,
          }),
        })
      )
    })

    it('should handle failed payment intents', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const confirmData = {
        paymentIntentId: 'pi_test_failed',
        jobId: testData.job.id,
        applicationId: testData.application.id,
      }

      const mockFailedPaymentIntent = {
        id: 'pi_test_failed',
        status: 'requires_payment_method',
        amount: 5000,
        currency: 'usd',
      }

      const job = { ...testData.job, employer: testData.employer }
      const application = { ...testData.application, freelancer: testData.user }

      mockPrisma.job.findUnique.mockResolvedValue(job)
      mockPrisma.application.findUnique.mockResolvedValue(application)
      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockFailedPaymentIntent as any)

      const request = createTestRequest('POST', '/api/payments/confirm', confirmData)
      const response = await confirmPayment(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('Payment not completed')
    })

    it('should prevent duplicate payment confirmations', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const confirmData = {
        paymentIntentId: 'pi_test_123',
        jobId: testData.job.id,
        applicationId: testData.application.id,
      }

      const existingPayment = {
        id: 'existing-payment',
        stripePaymentId: 'pi_test_123',
        status: 'COMPLETED',
      }

      mockPrisma.payment.findUnique.mockResolvedValue(existingPayment)

      const request = createTestRequest('POST', '/api/payments/confirm', confirmData)
      const response = await confirmPayment(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('already been processed')
    })
  })

  describe('POST /api/freelancer/create-stripe-account', () => {
    it('should create Stripe Connect account for freelancer', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const accountData = {
        country: 'US',
        returnUrl: 'https://example.com/return',
        refreshUrl: 'https://example.com/refresh',
      }

      const mockAccount = {
        id: 'acct_test_123',
      }

      const mockAccountLink = {
        url: 'https://connect.stripe.com/setup/acct_test_123',
      }

      const freelancerWithProfile = {
        ...testData.user,
        freelancerProfile: {
          ...testData.user.freelancerProfile,
          stripeAccountId: null,
        },
      }

      mockPrisma.user.findUnique.mockResolvedValue(freelancerWithProfile)
      mockStripe.accounts.create.mockResolvedValue(mockAccount as any)
      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink as any)
      mockPrisma.user.update.mockResolvedValue({
        ...freelancerWithProfile,
        freelancerProfile: {
          ...freelancerWithProfile.freelancerProfile,
          stripeAccountId: mockAccount.id,
        },
      })

      const request = createTestRequest('POST', '/api/freelancer/create-stripe-account', accountData)
      const response = await createStripeAccount(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.accountId).toBe(mockAccount.id)
      expect(data.onboardingUrl).toBe(mockAccountLink.url)

      expect(mockStripe.accounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'express',
          country: 'US',
          email: freelancerSession.user.email,
        })
      )

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: freelancerSession.user.id },
          data: {
            freelancerProfile: {
              update: {
                stripeAccountId: mockAccount.id,
              },
            },
          },
        })
      )
    })

    it('should prevent employers from creating Stripe accounts', async () => {
      const employerSession = createTestSession(testData.employer)
      mockAuthSession(employerSession)

      const accountData = {
        country: 'US',
        returnUrl: 'https://example.com/return',
        refreshUrl: 'https://example.com/refresh',
      }

      const request = createTestRequest('POST', '/api/freelancer/create-stripe-account', accountData)
      const response = await createStripeAccount(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(403)
      expect(data.error).toContain('Only freelancers')
    })

    it('should prevent creating duplicate Stripe accounts', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const freelancerWithStripeAccount = {
        ...testData.user,
        freelancerProfile: {
          ...testData.user.freelancerProfile,
          stripeAccountId: 'acct_existing_123',
        },
      }

      mockPrisma.user.findUnique.mockResolvedValue(freelancerWithStripeAccount)

      const accountData = {
        country: 'US',
        returnUrl: 'https://example.com/return',
        refreshUrl: 'https://example.com/refresh',
      }

      const request = createTestRequest('POST', '/api/freelancer/create-stripe-account', accountData)
      const response = await createStripeAccount(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('already has a Stripe account')
    })

    it('should validate required fields', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const invalidAccountData = {
        // Missing country, returnUrl, refreshUrl
      }

      const request = createTestRequest('POST', '/api/freelancer/create-stripe-account', invalidAccountData)
      const response = await createStripeAccount(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should handle Stripe account creation errors', async () => {
      const freelancerSession = createTestSession(testData.user)
      mockAuthSession(freelancerSession)

      const freelancerWithProfile = {
        ...testData.user,
        freelancerProfile: {
          ...testData.user.freelancerProfile,
          stripeAccountId: null,
        },
      }

      mockPrisma.user.findUnique.mockResolvedValue(freelancerWithProfile)
      mockStripe.accounts.create.mockRejectedValue(
        new Error('Account creation failed')
      )

      const accountData = {
        country: 'US',
        returnUrl: 'https://example.com/return',
        refreshUrl: 'https://example.com/refresh',
      }

      const request = createTestRequest('POST', '/api/freelancer/create-stripe-account', accountData)
      const response = await createStripeAccount(request)
      const data = await extractResponseData(response)

      expect(response.status).toBe(500)
      expect(data.error).toContain('Failed to create Stripe account')
    })
  })
})