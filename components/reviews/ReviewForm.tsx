"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface User {
  id: string
  name: string
  role: string
  avatar?: string
  companyName?: string
  title?: string
}

interface ReviewFormProps {
  recipient: User
  jobId?: string
  onSuccess?: (review: any) => void
  onCancel?: () => void
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  recipient,
  jobId,
  onSuccess,
  onCancel
}) => {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!rating || !title.trim() || !comment.trim()) {
      setError('Please fill in all fields and provide a rating')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientId: recipient.id,
          jobId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      })

      if (response.ok) {
        const review = await response.json()
        onSuccess?.(review)
        
        // Reset form
        setRating(0)
        setTitle('')
        setComment('')
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Error submitting review:', error)
      setError('An error occurred while submitting your review')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (interactive = false) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const filled = interactive 
        ? starValue <= (hoveredRating || rating)
        : starValue <= rating

      return (
        <button
          key={index}
          type="button"
          disabled={!interactive || loading}
          className={`text-2xl transition-colors ${
            interactive ? 'hover:scale-110' : ''
          } ${
            filled 
              ? 'text-yellow-400' 
              : 'text-gray-300 dark:text-gray-600'
          }`}
          onClick={() => interactive && setRating(starValue)}
          onMouseEnter={() => interactive && setHoveredRating(starValue)}
          onMouseLeave={() => interactive && setHoveredRating(0)}
        >
          ★
        </button>
      )
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <div className="flex items-center space-x-3 mt-4">
          <Avatar
            src={recipient.avatar}
            name={recipient.name}
            size="md"
          />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              {recipient.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {recipient.role === 'EMPLOYER' ? recipient.companyName : recipient.title}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rating *
            </label>
            <div className="flex items-center space-x-1">
              {renderStars(true)}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                  {rating} out of 5 stars
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience in a few words"
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {title.length}/100 characters
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Review *
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details about your experience working with this person..."
              rows={4}
              maxLength={1000}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
              disabled={loading}
            />
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {comment.length}/1000 characters
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              disabled={loading || !rating || !title.trim() || !comment.trim()}
              className="flex-1"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
                className="flex-1"
              >
                Cancel
              </Button>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Review Guidelines</p>
                <ul className="text-xs space-y-1">
                  <li>• Reviews are public and cannot be deleted once submitted</li>
                  <li>• Be honest and constructive in your feedback</li>
                  <li>• Focus on your professional experience</li>
                  <li>• Avoid personal attacks or inappropriate content</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}