"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface Payment {
  id: string
  amount: number
  platformFee: number
  currency: string
  status: string
  description: string
  paidAt?: string
  createdAt: string
  application: {
    job: {
      title: string
      employer: {
        profile: {
          firstName: string
          lastName: string
        }
        employerProfile: {
          companyName: string
        }
      }
    }
  }
}

interface PaymentStats {
  totalEarnings: number
  pendingPayments: number
  completedPayments: number
  thisMonthEarnings: number
}

export default function FreelancerPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/freelancer/payments')
      if (response.ok) {
        const data = await response.json()
        setPayments(data.payments)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-500'
      case 'PROCESSING':
        return 'bg-blue-500'
      case 'PENDING':
        return 'bg-yellow-500'
      case 'FAILED':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed'
      case 'PROCESSING':
        return 'Processing'
      case 'PENDING':
        return 'Pending'
      case 'FAILED':
        return 'Failed'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Payments & Earnings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your payments and earnings from completed work
              </p>
            </div>
            
            <Button onClick={() => window.location.href = '/freelancer/onboarding'}>
              Payment Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container-max section-padding py-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(stats.totalEarnings)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.completedPayments}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.pendingPayments}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(stats.thisMonthEarnings)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">This Month</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payments List */}
      <div className="container-max section-padding py-8">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No payments yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Your payment history will appear here once you start receiving payments from clients.
              </p>
              <Button onClick={() => window.location.href = '/freelancer/onboarding'}>
                Set Up Payments
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {payment.description}
                        </h3>
                        <Badge className={`${getStatusColor(payment.status)} text-white border-0`}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 dark:text-gray-400 mb-2">
                        From: {payment.application.job.employer.employerProfile.companyName}
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Gross Amount:</span>
                          <div className="font-medium">{formatCurrency(payment.amount)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Platform Fee:</span>
                          <div className="font-medium">-{formatCurrency(payment.platformFee)}</div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Net Amount:</span>
                          <div className="font-medium text-green-600">
                            {formatCurrency(payment.amount - payment.platformFee)}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            {payment.status === 'COMPLETED' ? 'Paid:' : 'Created:'}
                          </span>
                          <div className="font-medium">
                            {formatRelativeTime(payment.paidAt || payment.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(payment.amount - payment.platformFee)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        Your earnings
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}