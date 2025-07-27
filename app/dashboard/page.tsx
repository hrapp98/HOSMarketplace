"use client"

import React from 'react'
import { useSession } from 'next-auth/react'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import EmployerDashboard from '@/components/dashboard/EmployerDashboard'
import FreelancerDashboard from '@/components/dashboard/FreelancerDashboard'
import AdminDashboard from '@/components/dashboard/AdminDashboard'

export default function DashboardPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Please sign in to access your dashboard.
        </p>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (session.user.role) {
      case 'EMPLOYER':
        return <EmployerDashboard />
      case 'FREELANCER':
        return <FreelancerDashboard />
      case 'ADMIN':
        return <AdminDashboard />
      default:
        return (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Invalid Role
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Your account role is not recognized. Please contact support.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session.user.name?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>
      
      {renderDashboard()}
    </div>
  )
}