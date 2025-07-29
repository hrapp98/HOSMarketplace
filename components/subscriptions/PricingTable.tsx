"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency } from '@/lib/utils'

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

interface PricingTableProps {
  plans: Plan[]
  currentTier?: string
  onUpgrade?: (planId: string) => void
  loading?: boolean
}

export const PricingTable: React.FC<PricingTableProps> = ({
  plans,
  currentTier = 'FREE',
  onUpgrade,
  loading = false
}) => {
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    if (!onUpgrade) return
    
    setUpgrading(planId)
    try {
      await onUpgrade(planId)
    } finally {
      setUpgrading(null)
    }
  }

  const isCurrentPlan = (tier: string) => tier === currentTier
  const isDowngrade = (tier: string) => {
    const tierOrder = ['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE']
    return tierOrder.indexOf(tier) < tierOrder.indexOf(currentTier)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {plans.map((plan) => (
        <Card
          key={plan.id}
          className={`relative ${
            plan.popular
              ? 'border-2 border-primary-500 shadow-lg scale-105'
              : 'border border-gray-200 dark:border-gray-700'
          } ${
            isCurrentPlan(plan.tier)
              ? 'bg-primary-50 dark:bg-primary-900/20'
              : 'bg-white dark:bg-gray-800'
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary-500 text-white border-0 px-3 py-1">
                Most Popular
              </Badge>
            </div>
          )}

          {isCurrentPlan(plan.tier) && (
            <div className="absolute -top-3 right-4">
              <Badge className="bg-green-500 text-white border-0 px-3 py-1">
                Current Plan
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {plan.name}
            </CardTitle>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {plan.price === 0 ? 'Free' : formatCurrency(plan.price)}
              </span>
              {plan.price > 0 && (
                <span className="text-gray-500 dark:text-gray-400 ml-1">
                  /{plan.interval}
                </span>
              )}
            </div>
          </CardHeader>

          <CardContent>
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            <div className="space-y-2">
              {isCurrentPlan(plan.tier) ? (
                <Button disabled className="w-full">
                  Current Plan
                </Button>
              ) : isDowngrade(plan.tier) ? (
                <Button
                  variant="outline"
                  disabled
                  className="w-full opacity-50"
                >
                  Contact Support to Downgrade
                </Button>
              ) : (
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loading || upgrading !== null}
                  className="w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {upgrading === plan.id ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Processing...
                    </>
                  ) : plan.price === 0 ? (
                    'Get Started'
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              )}
            </div>

            {/* Usage Limits Display */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Job Posts:</span>
                  <span className="font-medium">
                    {plan.limits.jobPosts === -1 ? 'Unlimited' : plan.limits.jobPosts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Featured Posts:</span>
                  <span className="font-medium">
                    {plan.limits.featuredPosts === -1 ? 'Unlimited' : plan.limits.featuredPosts}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Support:</span>
                  <span className="font-medium capitalize">
                    {plan.limits.support}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}