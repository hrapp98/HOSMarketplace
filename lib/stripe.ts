import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20',
})

// Client-side Stripe instance
let stripePromise: Promise<Stripe | null>
export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

// Stripe webhook signature verification
export function constructEvent(body: string | Buffer, sig: string) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
  return stripe.webhooks.constructEvent(body, sig, endpointSecret)
}

// Payment status mapping
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
} as const

// Platform fee percentage (e.g., 5% platform fee)
export const PLATFORM_FEE_PERCENTAGE = 0.05

// Calculate platform fee
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_PERCENTAGE)
}

// Calculate freelancer amount after platform fee
export function calculateFreelancerAmount(amount: number): number {
  return amount - calculatePlatformFee(amount)
}

// Format amount for Stripe (convert to cents)
export function formatAmountForStripe(amount: number): number {
  return Math.round(amount * 100)
}

// Format amount from Stripe (convert from cents)
export function formatAmountFromStripe(amount: number): number {
  return amount / 100
}

// Create customer
export async function createStripeCustomer(
  email: string,
  name: string,
  metadata?: Record<string, string>
) {
  return await stripe.customers.create({
    email,
    name,
    metadata: metadata || {}
  })
}

// Create connected account for freelancers
export async function createConnectedAccount(
  email: string,
  country: string = 'US',
  metadata?: Record<string, string>
) {
  return await stripe.accounts.create({
    type: 'express',
    country,
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: metadata || {}
  })
}

// Create account link for onboarding
export async function createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })
}

// Create payment intent
export async function createPaymentIntent(
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount: formatAmountForStripe(amount),
    currency,
    metadata: metadata || {}
  })
}

// Create payment intent with connected account
export async function createPaymentIntentWithTransfer(
  amount: number,
  connectedAccountId: string,
  applicationFee: number,
  currency: string = 'usd',
  metadata?: Record<string, string>
) {
  return await stripe.paymentIntents.create({
    amount: formatAmountForStripe(amount),
    currency,
    application_fee_amount: formatAmountForStripe(applicationFee),
    transfer_data: {
      destination: connectedAccountId,
    },
    metadata: metadata || {}
  })
}

// Retrieve payment intent
export async function retrievePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId)
}

// Create refund
export async function createRefund(
  paymentIntentId: string,
  amount?: number,
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? formatAmountForStripe(amount) : undefined,
    reason: reason || 'requested_by_customer'
  })
}

// Get account details
export async function getAccountDetails(accountId: string) {
  return await stripe.accounts.retrieve(accountId)
}

// Create dashboard link for connected accounts
export async function createDashboardLink(accountId: string) {
  return await stripe.accounts.createLoginLink(accountId)
}