import { Suspense } from 'react'
import { SecurityDashboard } from '@/components/admin/security-dashboard'
import { SecuritySkeleton } from '@/components/admin/security-skeleton'

export default function AdminSecurityPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="text-gray-600">Monitor security metrics, alerts, and system health</p>
      </div>

      <Suspense fallback={<SecuritySkeleton />}>
        <SecurityDashboard />
      </Suspense>
    </div>
  )
}