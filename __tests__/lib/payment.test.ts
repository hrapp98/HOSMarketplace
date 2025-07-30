// Payment processing tests
import { 
  createPaymentIntent, 
  confirmPayment, 
  createConnectedAccount,
  calculatePlatformFee,
  processMarketplacePayment 
} from '@/lib/payment'
import { prisma } from '@/app/lib/prisma'
import Stripe from 'stripe'

// Mock Stripe
jest.mock('stripe')
const mockStripe = {
  paymentIntents: {
    create: jest.fn(),
    retrieve: jest.fn(),
    confirm: jest.fn(),
  },
  accounts: {
    create: jest.fn(),
    retrieve: jest.fn(),
  },
  accountLinks: {
    create: jest.fn(),
  },
} as jest.Mocked<Stripe>

// Mock Prisma (already mocked in jest.setup.js)
const mockPrisma = prisma as jest.Mocked<typeof prisma>

describe('Payment Processing', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('calculatePlatformFee', () => {
    it('should calculate correct platform fee', () => {
      expect(calculatePlatformFee(10000)).toBe(500) // 5% of $100.00
      expect(calculatePlatformFee(5000)).toBe(250)  // 5% of $50.00
      expect(calculatePlatformFee(1000)).toBe(50)   // 5% of $10.00
      expect(calculatePlatformFee(100)).toBe(5)     // 5% of $1.00
    })

    it('should handle zero amount', () => {
      expect(calculatePlatformFee(0)).toBe(0)
    })

    it('should round fees correctly', () => {
      expect(calculatePlatformFee(101)).toBe(5)     // 5% of $1.01 = $0.05
      expect(calculatePlatformFee(103)).toBe(5)     // 5% of $1.03 = $0.05 (rounded)
      expect(calculatePlatformFee(107)).toBe(5)     // 5% of $1.07 = $0.05 (rounded)
    })
  })

  describe('createPaymentIntent', () => {
    it('should create a payment intent successfully', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      }

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any)

      const result = await createPaymentIntent({
        amount: 10000,
        currency: 'usd',
        customerId: 'cus_test_123',
        jobId: 'job-123',
        freelancerId: 'freelancer-123',
      })

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        customer: 'cus_test_123',
        metadata: {
          jobId: 'job-123',
          freelancerId: 'freelancer-123',
        },
        application_fee_amount: 500, // 5% platform fee
      })

      expect(result).toEqual({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret',
      })
    })

    it('should handle Stripe errors', async () => {
      const error = new Error('Stripe error')
      mockStripe.paymentIntents.create.mockRejectedValue(error)

      await expect(createPaymentIntent({
        amount: 10000,
        currency: 'usd',
        customerId: 'cus_test_123',
        jobId: 'job-123',
        freelancerId: 'freelancer-123',
      })).rejects.toThrow('Stripe error')
    })
  })

  describe('confirmPayment', () => {
    it('should confirm payment and create database record', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'succeeded',
        amount: 10000,
        currency: 'usd',
        metadata: {
          jobId: 'job-123',
          freelancerId: 'freelancer-123',
        },
      }

      const mockPayment = {
        id: 'payment-123',
        amount: 10000,
        currency: 'USD',
        status: 'COMPLETED',
        stripePaymentId: 'pi_test_123',
      }

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any)
      mockPrisma.payment.create.mockResolvedValue(mockPayment as any)

      const result = await confirmPayment('pi_test_123', 'employer-123')

      expect(mockStripe.paymentIntents.retrieve).toHaveBeenCalledWith('pi_test_123')
      expect(mockPrisma.payment.create).toHaveBeenCalledWith({
        data: {
          amount: 10000,
          currency: 'USD',
          status: 'COMPLETED',
          payerId: 'employer-123',
          recipientId: 'freelancer-123',
          jobId: 'job-123',
          stripePaymentId: 'pi_test_123',
        },
      })

      expect(result).toEqual(mockPayment)
    })

    it('should handle failed payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test_123',
        status: 'requires_payment_method',
        amount: 10000,
        currency: 'usd',
        metadata: {
          jobId: 'job-123',
          freelancerId: 'freelancer-123',
        },
      }

      mockStripe.paymentIntents.retrieve.mockResolvedValue(mockPaymentIntent as any)

      await expect(confirmPayment('pi_test_123', 'employer-123'))
        .rejects.toThrow('Payment not completed')
    })
  })

  describe('createConnectedAccount', () => {
    it('should create connected account for freelancer', async () => {
      const mockAccount = {
        id: 'acct_test_123',
      }

      const mockAccountLink = {
        url: 'https://connect.stripe.com/setup/acct_test_123',
      }

      mockStripe.accounts.create.mockResolvedValue(mockAccount as any)
      mockStripe.accountLinks.create.mockResolvedValue(mockAccountLink as any)

      const result = await createConnectedAccount({
        email: 'freelancer@example.com',
        country: 'US',
        returnUrl: 'https://example.com/return',
        refreshUrl: 'https://example.com/refresh',
      })

      expect(mockStripe.accounts.create).toHaveBeenCalledWith({
        type: 'express',
        email: 'freelancer@example.com',
        country: 'US',
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      })

      expect(mockStripe.accountLinks.create).toHaveBeenCalledWith({
        account: 'acct_test_123',
        return_url: 'https://example.com/return',
        refresh_url: 'https://example.com/refresh',
        type: 'account_onboarding',
      })

      expect(result).toEqual({
        accountId: 'acct_test_123',
        onboardingUrl: 'https://connect.stripe.com/setup/acct_test_123',
      })
    })
  })

  describe('processMarketplacePayment', () => {
    it('should process marketplace payment with platform fee', async () => {
      const paymentData = {
        amount: 10000,
        currency: 'usd',
        customerId: 'cus_test_123',
        connectedAccountId: 'acct_test_456',
        jobId: 'job-123',
        freelancerId: 'freelancer-123',
      }

      const mockPaymentIntent = {
        id: 'pi_test_123',
        client_secret: 'pi_test_123_secret',
        amount: 10000,
        currency: 'usd',
        status: 'requires_payment_method',
      }

      mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent as any)

      const result = await processMarketplacePayment(paymentData)

      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
        amount: 10000,
        currency: 'usd',
        customer: 'cus_test_123',
        transfer_data: {
          destination: 'acct_test_456',
        },
        application_fee_amount: 500, // 5% platform fee
        metadata: {
          jobId: 'job-123',
          freelancerId: 'freelancer-123',
        },
      })

      expect(result).toEqual({
        paymentIntentId: 'pi_test_123',
        clientSecret: 'pi_test_123_secret',
      })
    })
  })
})