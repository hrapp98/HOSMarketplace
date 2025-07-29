"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PaymentForm } from '@/components/payments/PaymentForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'

interface Application {
  id: string
  coverLetter: string
  proposedRate?: number
  status: string
  job: {
    title: string
    salaryMin?: number
    salaryMax?: number
  }
  applicant: {
    profile: {
      firstName: string
      lastName: string
    }
    freelancerProfile: {
      hourlyRate: number
    }
  }
}

export default function EmployerPaymentPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.applicationId as string
  
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchApplication()
  }, [applicationId])

  const fetchApplication = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`)
      if (response.ok) {
        const data = await response.json()
        setApplication(data)
        
        // Set default payment amount (proposed rate or hourly rate)
        const defaultAmount = data.proposedRate || data.applicant.freelancerProfile.hourlyRate
        setPaymentAmount(defaultAmount)
        setDescription(`Payment for ${data.job.title}`)
      }
    } catch (error) {
      console.error('Error fetching application:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = () => {
    router.push('/employer/dashboard?tab=payments&success=true')
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Application Not Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The application you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => router.push('/employer/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const freelancerName = `${application.applicant.profile.firstName} ${application.applicant.profile.lastName}`

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Make Payment
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Pay {freelancerName} for work on "{application.job.title}"
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/employer/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Application Details */}
          <Card>
            <CardHeader>
              <CardTitle>Application Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Job Title
                  </label>
                  <p className="text-gray-900 dark:text-white">{application.job.title}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Freelancer
                  </label>
                  <p className="text-gray-900 dark:text-white">{freelancerName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Proposed Rate
                  </label>
                  <p className="text-gray-900 dark:text-white">
                    {application.proposedRate 
                      ? formatCurrency(application.proposedRate)
                      : formatCurrency(application.applicant.freelancerProfile.hourlyRate)
                    }
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400 block mb-2">
                    Cover Letter
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {application.coverLetter}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Setup */}
          <div className="space-y-6">
            {!showPaymentForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>Payment Setup</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Amount
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Payment description"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Payment Information
                          </h4>
                          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <ul className="list-disc list-inside space-y-1">
                              <li>Total amount: {formatCurrency(paymentAmount)}</li>
                              <li>Platform fee (5%): {formatCurrency(paymentAmount * 0.05)}</li>
                              <li>Freelancer receives: {formatCurrency(paymentAmount * 0.95)}</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowPaymentForm(true)}
                      disabled={!paymentAmount || paymentAmount <= 0}
                      className="w-full"
                    >
                      Proceed to Payment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <PaymentForm
                applicationId={applicationId}
                amount={paymentAmount}
                description={description}
                jobTitle={application.job.title}
                freelancerName={freelancerName}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}