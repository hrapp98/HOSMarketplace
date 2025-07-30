import { Suspense } from 'react'
import { JobsManagement } from '@/components/admin/jobs-management'
import { JobsSkeleton } from '@/components/admin/jobs-skeleton'

export default function AdminJobsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Jobs Management</h1>
        <p className="text-gray-600">Monitor and manage job postings across the platform</p>
      </div>

      <Suspense fallback={<JobsSkeleton />}>
        <JobsManagement />
      </Suspense>
    </div>
  )
}