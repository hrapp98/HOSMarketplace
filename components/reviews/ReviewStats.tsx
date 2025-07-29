"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ReviewStats {
  average: number
  count: number
  distribution?: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

interface ReviewStatsProps {
  stats: ReviewStats
  className?: string
}

export const ReviewStats: React.FC<ReviewStatsProps> = ({
  stats,
  className = ""
}) => {
  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'text-sm',
      md: 'text-lg',
      lg: 'text-2xl'
    }

    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`${sizeClasses[size]} ${
          index < Math.floor(rating) 
            ? 'text-yellow-400' 
            : index < rating 
              ? 'text-yellow-300' 
              : 'text-gray-300 dark:text-gray-600'
        }`}
      >
        ★
      </span>
    ))
  }

  const getRatingDistribution = () => {
    if (!stats.distribution || stats.count === 0) return null

    return [5, 4, 3, 2, 1].map(rating => {
      const count = stats.distribution?.[rating as keyof typeof stats.distribution] || 0
      const percentage = (count / stats.count) * 100

      return (
        <div key={rating} className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 w-12">
            <span className="text-sm text-gray-600 dark:text-gray-400">{rating}</span>
            <span className="text-yellow-400 text-sm">★</span>
          </div>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
            {count}
          </span>
        </div>
      )
    })
  }

  if (stats.count === 0) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Be the first to leave a review!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Reviews & Ratings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {stats.average.toFixed(1)}
            </div>
            <div className="flex justify-center mb-2">
              {renderStars(stats.average, 'lg')}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Based on {stats.count} review{stats.count !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          {stats.distribution && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                Rating Breakdown
              </h4>
              <div className="space-y-2">
                {getRatingDistribution()}
              </div>
            </div>
          )}

          {/* Rating Summary */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-500">
                  {stats.distribution ? 
                    Math.round(((stats.distribution[5] + stats.distribution[4]) / stats.count) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Positive</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-500">
                  {stats.distribution ? 
                    Math.round((stats.distribution[3] / stats.count) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Neutral</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {stats.distribution ? 
                    Math.round(((stats.distribution[2] + stats.distribution[1]) / stats.count) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Negative</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}