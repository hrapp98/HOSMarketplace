import { Suspense } from 'react'
import { AnalyticsDashboard } from '@/components/admin/analytics-dashboard'
import { AnalyticsSkeleton } from '@/components/admin/analytics-skeleton'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Platform usage metrics, user behavior, and performance insights</p>
      </div>

      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsDashboard />
      </Suspense>
    </div>
  )
}