"use client"

import React, { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  applicationId: string
  amount: number
  description: string
  jobTitle: string
  freelancerName: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface PaymentFormInnerProps extends PaymentFormProps {
  clientSecret?: string
}

const PaymentFormInner: React.FC<PaymentFormInnerProps> = ({
  applicationId,
  amount,
  description,
  jobTitle,
  freelancerName,
  clientSecret,
  onSuccess,
  onError
}) => {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentIntentSecret, setPaymentIntentSecret] = useState(clientSecret)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create payment intent if not provided
      if (!paymentIntentSecret) {
        const response = await fetch('/api/payments/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            applicationId,
            amount,
            description,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create payment')
        }

        const { clientSecret: newClientSecret } = await response.json()
        setPaymentIntentSecret(newClientSecret)
      }

      const cardElement = elements.getElement(CardElement)

      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Confirm payment
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentSecret!,
        {
          payment_method: {
            card: cardElement,
          }
        }
      )

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment failed')
      }

      if (paymentIntent?.status === 'succeeded') {
        onSuccess?.()
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const platformFee = Math.round(amount * 0.05 * 100) / 100
  const freelancerAmount = amount - platformFee

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Payment Summary
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Job:</span>
                <span className="font-medium">{jobTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Freelancer:</span>
                <span className="font-medium">{freelancerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                <span>{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Platform Fee (5%):</span>
                <span>-{formatCurrency(platformFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                <span className="font-medium">Freelancer Receives:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(freelancerAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Card Details
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3">
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
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!stripe || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Processing...
                </>
              ) : (
                `Pay ${formatCurrency(amount)}`
              )}
            </Button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Your payment is secure and encrypted. You will be charged {formatCurrency(amount)}.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export const PaymentForm: React.FC<PaymentFormProps> = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <PaymentFormInner {...props} />
    </Elements>
  )
}