"use client"

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Subscription {
  id: string
  tier: string
  startDate: string
  endDate?: string
  isActive: boolean
  jobPostLimit: number
  jobPostsUsed: number
  featuredPosts: number
  autoRenew: boolean
}

interface SubscriptionStatusProps {
  subscription: Subscription
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  subscription
}) => {
  const getTierName = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'Free Plan'
      case 'BASIC':
        return 'Basic Plan'
      case 'PROFESSIONAL':
        return 'Professional Plan'
      case 'ENTERPRISE':
        return 'Enterprise Plan'
      default:
        return tier
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'FREE':
        return 'bg-gray-500'
      case 'BASIC':
        return 'bg-blue-500'
      case 'PROFESSIONAL':
        return 'bg-purple-500'
      case 'ENTERPRISE':
        return 'bg-gold-500'
      default:
        return 'bg-gray-500'
    }
  }

  const isNearLimit = subscription.jobPostLimit > 0 && 
    subscription.jobPostsUsed / subscription.jobPostLimit >= 0.8

  const isAtLimit = subscription.jobPostLimit > 0 && 
    subscription.jobPostsUsed >= subscription.jobPostLimit

  const daysUntilRenewal = subscription.endDate 
    ? Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscription Status</CardTitle>
          <Badge className={`${getTierColor(subscription.tier)} text-white border-0`}>
            {getTierName(subscription.tier)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Status:
            </span>
            <Badge variant={subscription.isActive ? 'success' : 'danger'}>
              {subscription.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {/* Job Posts Usage */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Job Posts Used:
              </span>
              <span className={`text-sm font-medium ${
                isAtLimit ? 'text-red-600' : isNearLimit ? 'text-yellow-600' : 'text-gray-900 dark:text-white'
              }`}>
                {subscription.jobPostsUsed} / {
                  subscription.jobPostLimit === -1 ? '∞' : subscription.jobPostLimit
                }
              </span>
            </div>
            {subscription.jobPostLimit > 0 && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{
                    width: `${Math.min((subscription.jobPostsUsed / subscription.jobPostLimit) * 100, 100)}%`
                  }}
                ></div>
              </div>
            )}
          </div>

          {/* Featured Posts */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Featured Posts Available:
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {subscription.featuredPosts === -1 ? '∞' : subscription.featuredPosts}
            </span>
          </div>

          {/* Subscription Period */}
          {subscription.tier !== 'FREE' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Started:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDate(subscription.startDate)}
                </span>
              </div>

              {subscription.endDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {daysUntilRenewal && daysUntilRenewal > 0 ? 'Renews:' : 'Expired:'}
                  </span>
                  <span className={`text-sm ${
                    daysUntilRenewal && daysUntilRenewal <= 7 && daysUntilRenewal > 0
                      ? 'text-yellow-600 font-medium'
                      : daysUntilRenewal && daysUntilRenewal <= 0
                      ? 'text-red-600 font-medium'
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {formatDate(subscription.endDate)}
                    {daysUntilRenewal && daysUntilRenewal > 0 && daysUntilRenewal <= 7 && (
                      <span className="ml-1">({daysUntilRenewal} days)</span>
                    )}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Auto-renewal:
                </span>
                <Badge variant={subscription.autoRenew ? 'success' : 'warning'}>
                  {subscription.autoRenew ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
            </>
          )}

          {/* Warnings */}
          {isAtLimit && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.12 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Job Post Limit Reached
                  </h4>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    You've reached your monthly job post limit. Upgrade your plan to post more jobs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isNearLimit && !isAtLimit && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L3.12 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Approaching Limit
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    You're approaching your monthly job post limit. Consider upgrading for more posts.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild className="flex-1">
              <Link href="/pricing">
                {subscription.tier === 'FREE' ? 'Upgrade Plan' : 'Change Plan'}
              </Link>
            </Button>
            {subscription.tier !== 'FREE' && (
              <Button variant="outline" asChild className="flex-1">
                <Link href="/dashboard/subscription/manage">
                  Manage Subscription
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}