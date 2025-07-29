"use client"

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentDetails {
  applicationId: string
  freelancer: {
    id: string
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
    freelancerProfile: {
      title: string
    }
  }
  job: {
    id: string
    title: string
  }
  amount: number
  currency: string
  description: string
  platformFee: number
  freelancerAmount: number
}

function PaymentForm() {
  const stripe = useStripe()
  const elements = useElements()
  const searchParams = useSearchParams()
  
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)
  const [clientSecret, setClientSecret] = useState<string>('')

  const applicationId = searchParams.get('application')

  useEffect(() => {
    if (applicationId) {
      fetchPaymentDetails()
    }
  }, [applicationId])

  useEffect(() => {
    if (paymentDetails) {
      createPaymentIntent()
    }
  }, [paymentDetails])

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payment/details?application=${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        setPaymentDetails(data)
      } else {
        setError('Failed to load payment details')
      }
    } catch (error) {
      console.error('Error fetching payment details:', error)
      setError('Failed to load payment details')
    } finally {
      setLoading(false)
    }
  }

  const createPaymentIntent = async () => {
    if (!paymentDetails) return

    try {
      const response = await fetch('/api/payment/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          applicationId: paymentDetails.applicationId,
          amount: paymentDetails.amount,
          currency: paymentDetails.currency
        })
      })

      if (response.ok) {
        const data = await response.json()
        setClientSecret(data.clientSecret)
      } else {
        setError('Failed to create payment intent')
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      setError('Failed to create payment intent')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setError('Card element not found')
      setProcessing(false)
      return
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {
          name: 'Employer', // You might want to get this from session
        },
      }
    })

    if (error) {
      setError(error.message || 'An error occurred')
      setProcessing(false)
    } else if (paymentIntent.status === 'succeeded') {
      setSucceeded(true)
      setProcessing(false)
      
      // Update payment status in database
      await fetch('/api/payment/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          applicationId: paymentDetails?.applicationId
        })
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!paymentDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Payment details not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              The payment information could not be loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (succeeded) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Payment Successful!
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your payment of {formatCurrency(paymentDetails.amount)} has been processed successfully.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              The freelancer will receive {formatCurrency(paymentDetails.freelancerAmount)} after platform fees.
            </p>
            <Button onClick={() => window.location.href = '/employer/jobs'}>
              Return to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
      <div className="container-max section-padding">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Payment
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Secure payment processing powered by Stripe
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Job Details */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Job</h4>
                  <p className="text-gray-600 dark:text-gray-400">{paymentDetails.job.title}</p>
                </div>

                {/* Freelancer Details */}
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Freelancer</h4>
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={paymentDetails.freelancer.profile.avatar}
                      name={`${paymentDetails.freelancer.profile.firstName} ${paymentDetails.freelancer.profile.lastName}`}
                      size="md"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {paymentDetails.freelancer.profile.firstName} {paymentDetails.freelancer.profile.lastName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {paymentDetails.freelancer.freelancerProfile.title}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium">{formatCurrency(paymentDetails.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Platform Fee (5%)</span>
                      <span className="font-medium">{formatCurrency(paymentDetails.platformFee)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span>Total</span>
                      <span>{formatCurrency(paymentDetails.amount)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Freelancer receives:</strong> {formatCurrency(paymentDetails.freelancerAmount)}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                    After platform fees are deducted
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Card Information
                    </label>
                    <div className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                      <CardElement
                        options={{
                          style: {
                            base: {
                              fontSize: '16px',
                              color: '#424770',
                              '::placeholder': {
                                color: '#aab7c4',
                              },
                            },
                            invalid: {
                              color: '#9e2146',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={!stripe || processing}
                    className="w-full"
                    size="lg"
                  >
                    {processing ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Pay ${formatCurrency(paymentDetails.amount)}`
                    )}
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Your payment information is secure and encrypted.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm />
    </Elements>
  )
}