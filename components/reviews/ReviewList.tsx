"use client"

import React, { useState, useEffect } from 'react'
import { ReviewCard } from './ReviewCard'
import { ReviewStats } from './ReviewStats'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

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

interface ReviewListProps {
  recipientId: string
  currentUserId?: string
  showStats?: boolean
  showWriteButton?: boolean
  onWriteReview?: () => void
}

export const ReviewList: React.FC<ReviewListProps> = ({
  recipientId,
  currentUserId,
  showStats = true,
  showWriteButton = false,
  onWriteReview
}) => {
  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    fetchReviews(1, true)
  }, [recipientId])

  const fetchReviews = async (pageNum: number, reset: boolean = false) => {
    try {
      const response = await fetch(
        `/api/reviews?recipientId=${recipientId}&page=${pageNum}&limit=10`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (reset) {
          setReviews(data.reviews)
          if (showStats) {
            setStats(data.avgRating ? {
              average: data.avgRating.average,
              count: data.avgRating.count,
              distribution: calculateDistribution(data.reviews)
            } : { average: 0, count: 0 })
          }
        } else {
          setReviews(prev => [...prev, ...data.reviews])
        }
        
        setTotalPages(data.pagination.totalPages)
        setPage(pageNum)
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const calculateDistribution = (reviewList: Review[]) => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviewList.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++
    })
    return distribution
  }

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      setLoadingMore(true)
      fetchReviews(page + 1)
    }
  }

  const handleReviewDeleted = (reviewId: string) => {
    setReviews(prev => prev.filter(review => review.id !== reviewId))
    
    // Refresh stats
    if (showStats) {
      fetchReviews(1, true)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {showStats && (
          <div className="animate-pulse">
            <div className="bg-gray-300 dark:bg-gray-700 h-64 rounded-xl"></div>
          </div>
        )}
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {showStats && stats && (
        <ReviewStats stats={stats} />
      )}

      {/* Write Review Button */}
      {showWriteButton && onWriteReview && (
        <div className="flex justify-center">
          <Button onClick={onWriteReview}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
            Write a Review
          </Button>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Reviews Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            This user hasn't received any reviews yet.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                canEdit={currentUserId === review.author.id}
                onDelete={handleReviewDeleted}
              />
            ))}
          </div>

          {/* Load More Button */}
          {page < totalPages && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load More Reviews'
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}