"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Badge } from '@/components/ui/Badge'

interface OnboardingStatus {
  hasStripeAccount: boolean
  stripeAccountId?: string
  accountStatus: 'NONE' | 'PENDING' | 'VERIFIED'
  detailsSubmitted: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
}

export default function FreelancerOnboardingPage() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (session) {
      fetchOnboardingStatus()
    }
  }, [session])

  const fetchOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/freelancer/stripe-status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  const createStripeAccount = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/freelancer/create-stripe-account', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to create Stripe account')
      }
    } catch (error) {
      console.error('Error creating Stripe account:', error)
      alert('Failed to create Stripe account')
    } finally {
      setCreating(false)
    }
  }

  const accessStripeDashboard = async () => {
    try {
      const response = await fetch('/api/freelancer/stripe-dashboard', {
        method: 'POST'
      })

      if (response.ok) {
        const data = await response.json()
        window.open(data.dashboardUrl, '_blank')
      } else {
        alert('Failed to access Stripe dashboard')
      }
    } catch (error) {
      console.error('Error accessing Stripe dashboard:', error)
      alert('Failed to access Stripe dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!status) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Unable to load onboarding status
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please try refreshing the page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusBadge = () => {
    switch (status.accountStatus) {
      case 'VERIFIED':
        return <Badge variant="success">Verified</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      default:
        return <Badge variant="outline">Not Started</Badge>
    }
  }

  const getStatusDescription = () => {
    if (status.accountStatus === 'VERIFIED') {
      return 'Your account is fully verified and you can receive payments.'
    } else if (status.accountStatus === 'PENDING') {
      return 'Your account is being reviewed. You may need to complete additional information.'
    } else {
      return 'You need to set up your payment account to receive payments from clients.'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Payment Setup
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Set up your payment account to receive payments from clients
            </p>
          </div>
        </div>
      </div>

      <div className="container-max section-padding py-12">
        <div className="max-w-2xl mx-auto">
          {/* Current Status */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Account Status</CardTitle>
                {getStatusBadge()}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {getStatusDescription()}
              </p>

              {status.hasStripeAccount && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Account Created:</span>
                    <span className="font-medium text-green-600">✓ Yes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Details Submitted:</span>
                    <span className={`font-medium ${status.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
                      {status.detailsSubmitted ? '✓ Yes' : '⚠ Pending'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Can Receive Payments:</span>
                    <span className={`font-medium ${status.chargesEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {status.chargesEnabled ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Payouts Enabled:</span>
                    <span className={`font-medium ${status.payoutsEnabled ? 'text-green-600' : 'text-red-600'}`}>
                      {status.payoutsEnabled ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card>
            <CardHeader>
              <CardTitle>
                {!status.hasStripeAccount ? 'Get Started' : 'Manage Account'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!status.hasStripeAccount ? (
                <div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    To receive payments from clients, you need to set up a payment account. 
                    This is powered by Stripe, a secure payment processor used by millions of businesses worldwide.
                  </p>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      What you'll need:
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Personal information (name, address, date of birth)</li>
                      <li>• Tax identification number (SSN or EIN)</li>
                      <li>• Bank account details for payouts</li>
                      <li>• Government-issued ID for verification</li>
                    </ul>
                  </div>

                  <Button 
                    onClick={createStripeAccount}
                    disabled={creating}
                    size="lg"
                    className="w-full"
                  >
                    {creating ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Setting up account...
                      </>
                    ) : (
                      'Set Up Payment Account'
                    )}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {status.accountStatus !== 'VERIFIED' && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                        Complete Your Setup
                      </h4>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
                        Your account setup is not complete. You may need to provide additional information 
                        or verify your identity to start receiving payments.
                      </p>
                      <Button 
                        onClick={createStripeAccount}
                        variant="outline"
                        size="sm"
                      >
                        Continue Setup
                      </Button>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <Button 
                      onClick={accessStripeDashboard}
                      variant="outline"
                      className="flex-1"
                    >
                      View Dashboard
                    </Button>
                    <Button 
                      onClick={fetchOnboardingStatus}
                      variant="ghost"
                      className="flex-1"
                    >
                      Refresh Status
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Help Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    What is Stripe?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Stripe is a secure payment processor that handles all payment transactions. 
                    Your financial information is protected and encrypted.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    When do I get paid?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Payments are typically transferred to your bank account within 2-7 business days 
                    after the client pays for your work.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                    Are there any fees?
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    HireOverseas takes a 5% platform fee from each payment. 
                    Stripe charges standard payment processing fees.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}