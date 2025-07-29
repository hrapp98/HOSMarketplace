"use client"

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  isVerified: boolean
  createdAt: string
  updatedAt: string
  author: {
    id: string
    name: string
    role: string
    avatar?: string
    companyName?: string
    title?: string
  }
}

interface ReviewCardProps {
  review: Review
  canEdit?: boolean
  onEdit?: (review: Review) => void
  onDelete?: (reviewId: string) => void
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  canEdit = false,
  onEdit,
  onDelete
}) => {
  const [showFullComment, setShowFullComment] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        className={`text-lg ${
          index < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
        }`}
      >
        ★
      </span>
    ))
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        onDelete?.(review.id)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete review')
      }
    } catch (error) {
      console.error('Error deleting review:', error)
      alert('An error occurred while deleting the review')
    } finally {
      setDeleting(false)
    }
  }

  const isLongComment = review.comment.length > 200
  const displayComment = showFullComment ? review.comment : review.comment.slice(0, 200)

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar
              src={review.author.avatar}
              name={review.author.name}
              size="md"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  {review.author.name}
                </h4>
                {review.isVerified && (
                  <Badge variant="success" size="sm">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Verified
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <span>
                  {review.author.role === 'EMPLOYER' 
                    ? review.author.companyName || 'Employer'
                    : review.author.title || 'Freelancer'
                  }
                </span>
                <span>•</span>
                <span>{formatRelativeTime(review.createdAt)}</span>
                {review.updatedAt !== review.createdAt && (
                  <>
                    <span>•</span>
                    <span className="italic">edited</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {canEdit && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(review)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-2 mb-3">
          <div className="flex">
            {renderStars(review.rating)}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {review.rating}/5
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {review.title}
        </h3>

        {/* Comment */}
        <div className="text-gray-700 dark:text-gray-300">
          <p className="whitespace-pre-wrap leading-relaxed">
            {displayComment}
            {isLongComment && !showFullComment && '...'}
          </p>
          
          {isLongComment && (
            <button
              onClick={() => setShowFullComment(!showFullComment)}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-2"
            >
              {showFullComment ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}