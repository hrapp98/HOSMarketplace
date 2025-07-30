import { Suspense } from 'react'
import { AdminDashboard } from '@/components/admin/admin-dashboard'
import { AdminDashboardSkeleton } from '@/components/admin/admin-dashboard-skeleton'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Platform overview and key metrics</p>
      </div>

      <Suspense fallback={<AdminDashboardSkeleton />}>
        <AdminDashboard />
      </Suspense>
    </div>
  )
}