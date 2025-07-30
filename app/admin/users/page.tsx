import { Suspense } from 'react'
import { UsersManagement } from '@/components/admin/users-management'
import { UsersSkeleton } from '@/components/admin/users-skeleton'

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-gray-600">Manage platform users, profiles, and permissions</p>
      </div>

      <Suspense fallback={<UsersSkeleton />}>
        <UsersManagement />
      </Suspense>
    </div>
  )
}