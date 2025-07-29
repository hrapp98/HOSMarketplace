"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ReviewCard } from '@/components/reviews/ReviewCard'
import { ReviewStats } from '@/components/reviews/ReviewStats'

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
  recipient: {
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
}

export default function ReviewsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'received' | 'given'>('received')
  const [reviewsReceived, setReviewsReceived] = useState<Review[]>([])
  const [reviewsGiven, setReviewsGiven] = useState<Review[]>([])
  const [receivedStats, setReceivedStats] = useState<ReviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingMore, setLoadingMore] = useState(false)

  useEffect(() => {
    if (session) {
      fetchReviews()
    } else {
      router.push('/auth/signin')
    }
  }, [session, activeTab])

  const fetchReviews = async (pageNum: number = 1, reset: boolean = true) => {
    if (!session) return

    try {
      const queryParam = activeTab === 'received' 
        ? `recipientId=${session.user.id}`
        : `authorId=${session.user.id}`

      const response = await fetch(
        `/api/reviews?${queryParam}&page=${pageNum}&limit=10`
      )
      
      if (response.ok) {
        const data = await response.json()
        
        if (activeTab === 'received') {
          if (reset) {
            setReviewsReceived(data.reviews)
            setReceivedStats(data.avgRating || { average: 0, count: 0 })
          } else {
            setReviewsReceived(prev => [...prev, ...data.reviews])
          }
        } else {
          if (reset) {
            setReviewsGiven(data.reviews)
          } else {
            setReviewsGiven(prev => [...prev, ...data.reviews])
          }
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

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      setLoadingMore(true)
      fetchReviews(page + 1, false)
    }
  }

  const handleReviewDeleted = (reviewId: string) => {
    if (activeTab === 'received') {
      setReviewsReceived(prev => prev.filter(review => review.id !== reviewId))
    } else {
      setReviewsGiven(prev => prev.filter(review => review.id !== reviewId))
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentReviews = activeTab === 'received' ? reviewsReceived : reviewsGiven
  const canEdit = activeTab === 'given'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Reviews & Ratings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your reviews and see what others are saying about you
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-6">
              <button
                onClick={() => {
                  setActiveTab('received')
                  setLoading(true)
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'received'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Reviews Received ({receivedStats?.count || 0})
              </button>
              <button
                onClick={() => {
                  setActiveTab('given')
                  setLoading(true)
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'given'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Reviews Given ({reviewsGiven.length})
              </button>
            </div>

            {/* Reviews List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : currentReviews.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No Reviews {activeTab === 'received' ? 'Received' : 'Given'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {activeTab === 'received' 
                      ? "You haven't received any reviews yet. Complete more projects to start building your reputation!"
                      : "You haven't written any reviews yet. Share your experience working with others!"
                    }
                  </p>
                  {activeTab === 'received' && (
                    <Button onClick={() => router.push('/jobs')}>
                      Find Work
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-6">
                  {currentReviews.map((review) => (
                    <div key={review.id}>
                      <ReviewCard
                        review={review}
                        canEdit={canEdit}
                        onDelete={handleReviewDeleted}
                      />
                      {activeTab === 'received' && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Review from: {review.author.name}
                          {review.author.companyName && ` (${review.author.companyName})`}
                        </div>
                      )}
                      {activeTab === 'given' && (
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                          Review for: {review.recipient.name}
                          {review.recipient.companyName && ` (${review.recipient.companyName})`}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Load More Button */}
                {page < totalPages && (
                  <div className="flex justify-center mt-8">
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

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Review Stats - only show for received reviews */}
            {activeTab === 'received' && receivedStats && (
              <ReviewStats stats={receivedStats} />
            )}

            {/* Tips Card */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeTab === 'received' ? 'Building Your Reputation' : 'Writing Great Reviews'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeTab === 'received' ? (
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Deliver high-quality work on time</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Communicate clearly and promptly</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Go above and beyond expectations</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Ask satisfied clients for reviews</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Be honest and constructive</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Focus on professional experience</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Provide specific examples</span>
                    </div>
                    <div className="flex items-start">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Help others make informed decisions</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}