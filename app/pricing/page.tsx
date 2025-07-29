"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PricingTable } from '@/components/subscriptions/PricingTable'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Plan {
  id: string
  name: string
  tier: string
  price: number
  currency: string
  interval: string
  features: string[]
  limits: {
    jobPosts: number
    featuredPosts: number
    applicantFilters: string
    support: string
  }
  popular: boolean
}

interface Subscription {
  tier: string
}

export default function PricingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    fetchPlans()
    if (session) {
      fetchSubscription()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      if (response.ok) {
        const data = await response.json()
        setPlans(data.plans)
      }
    } catch (error) {
      console.error('Error fetching plans:', error)
    }
  }

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'EMPLOYER') {
      alert('Only employers can purchase subscription plans.')
      return
    }

    setUpgrading(true)
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error upgrading subscription:', error)
      alert('An error occurred while processing your request')
    } finally {
      setUpgrading(false)
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
        <div className="container-max section-padding py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              Find the perfect plan for your hiring needs. Scale your recruitment efforts with our comprehensive platform features.
            </p>
            
            {session && session.user.role !== 'EMPLOYER' && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto mb-8">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Subscription Plans for Employers Only
                    </h4>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      These subscription plans are designed for employers who want to post jobs and hire talent. 
                      As a {session.user.role.toLowerCase()}, you can browse all the features but won't need a subscription.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="container-max section-padding py-12">
        <PricingTable
          plans={plans}
          currentTier={subscription?.tier}
          onUpgrade={handleUpgrade}
          loading={upgrading}
        />
      </div>

      {/* FAQ Section */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-12">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Got questions? We've got answers. If you can't find what you're looking for, feel free to contact our support team.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I change my plan anytime?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can upgrade your plan at any time. Downgrades will take effect at the end of your current billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                We offer a 30-day money-back guarantee for all paid plans. Contact our support team if you're not satisfied.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                What happens when I reach my job post limit?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                When you reach your monthly limit, you'll need to upgrade your plan or wait until the next billing period to post more jobs.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Is there a setup fee?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                No setup fees! You only pay the monthly subscription fee. Start using all features immediately after subscribing.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Can I cancel my subscription?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Do you offer enterprise discounts?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! Contact our sales team for custom enterprise plans and volume discounts for large organizations.
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Still have questions?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline">
                <Link href="/contact">Contact Support</Link>
              </Button>
              <Button asChild>
                <Link href="/demo">Schedule a Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}