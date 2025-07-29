"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface Application {
  id: string
  coverLetter: string
  proposedRate?: number
  availability: string
  status: string
  appliedAt: string
  updatedAt: string
  job: {
    id: string
    title: string
    employmentType: string
    experienceLevel: string
    salaryMin?: number
    salaryMax?: number
    currency: string
    location?: string
    isRemote: boolean
    status: string
    employer: {
      profile: {
        firstName: string
        lastName: string
        avatar?: string
      }
      employerProfile: {
        companyName: string
        logo?: string
        isVerified: boolean
      }
    }
  }
}

export default function FreelancerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/freelancer/applications')
      if (response.ok) {
        const data = await response.json()
        setApplications(data.applications)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) {
      return
    }

    try {
      const response = await fetch(`/api/freelancer/applications/${applicationId}/withdraw`, {
        method: 'PATCH'
      })

      if (response.ok) {
        // Update local state
        setApplications(prev => prev.map(app => 
          app.id === applicationId ? { ...app, status: 'WITHDRAWN' } : app
        ))
        
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? { ...prev, status: 'WITHDRAWN' } : null)
        }
      } else {
        alert('Failed to withdraw application')
      }
    } catch (error) {
      console.error('Error withdrawing application:', error)
      alert('Failed to withdraw application')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500'
      case 'SHORTLISTED':
        return 'bg-blue-500'
      case 'INTERVIEW':
        return 'bg-purple-500'
      case 'ACCEPTED':
        return 'bg-green-500'
      case 'REJECTED':
        return 'bg-red-500'
      case 'WITHDRAWN':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending Review'
      case 'SHORTLISTED':
        return 'Shortlisted'
      case 'INTERVIEW':
        return 'Interview Stage'
      case 'ACCEPTED':
        return 'Accepted'
      case 'REJECTED':
        return 'Not Selected'
      case 'WITHDRAWN':
        return 'Withdrawn'
      default:
        return status
    }
  }

  const getSalaryRange = (job: Application['job']) => {
    if (job.salaryMin && job.salaryMax) {
      return `${formatCurrency(job.salaryMin, job.currency)} - ${formatCurrency(job.salaryMax, job.currency)}/hr`
    } else if (job.salaryMin) {
      return `From ${formatCurrency(job.salaryMin, job.currency)}/hr`
    } else if (job.salaryMax) {
      return `Up to ${formatCurrency(job.salaryMax, job.currency)}/hr`
    }
    return null
  }

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  })

  const groupedApplications = {
    active: filteredApplications.filter(app => ['PENDING', 'SHORTLISTED', 'INTERVIEW'].includes(app.status)),
    completed: filteredApplications.filter(app => ['ACCEPTED', 'REJECTED', 'WITHDRAWN'].includes(app.status))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedApplication(application)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar
              src={application.job.employer.employerProfile.logo}
              name={application.job.employer.employerProfile.companyName}
              size="md"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {application.job.title}
              </h3>
              <div className="flex items-center space-x-2">
                <p className="text-primary-600 dark:text-primary-400 font-medium">
                  {application.job.employer.employerProfile.companyName}
                </p>
                {application.job.employer.employerProfile.isVerified && (
                  <Badge variant="success" size="xs">Verified</Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge className={`${getStatusColor(application.status)} text-white border-0`}>
              {getStatusLabel(application.status)}
            </Badge>
            {application.proposedRate && (
              <div className="text-right">
                <div className="text-sm font-bold text-primary-600">
                  {formatCurrency(application.proposedRate)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">your rate</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge variant="outline" size="sm">{application.job.employmentType}</Badge>
          <Badge variant="outline" size="sm">{application.job.experienceLevel}</Badge>
          {application.job.isRemote ? (
            <Badge variant="primary" size="sm">Remote</Badge>
          ) : (
            <Badge variant="secondary" size="sm">{application.job.location}</Badge>
          )}
          {getSalaryRange(application.job) && (
            <Badge variant="success" size="sm">{getSalaryRange(application.job)}</Badge>
          )}
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {application.coverLetter}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="text-gray-500 dark:text-gray-400">
            Applied {formatRelativeTime(application.appliedAt)}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-gray-500 dark:text-gray-400">Status updated:</span>
            <span className="font-medium">{formatRelativeTime(application.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                My Applications
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your job applications and their status
              </p>
            </div>
            
            <Button asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {applications.length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {applications.filter(app => app.status === 'PENDING').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {applications.filter(app => ['SHORTLISTED', 'INTERVIEW'].includes(app.status)).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {applications.filter(app => app.status === 'ACCEPTED').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Accepted</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filter by status:
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Applications</option>
              <option value="PENDING">Pending Review</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW">Interview</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Not Selected</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="container-max section-padding py-8">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No applications found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {statusFilter === 'all' 
                  ? "You haven't applied to any jobs yet."
                  : `No applications with status "${getStatusLabel(statusFilter)}".`
                }
              </p>
              <Button asChild>
                <Link href="/jobs">Start Applying</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Active Applications */}
            {groupedApplications.active.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Active Applications ({groupedApplications.active.length})
                </h2>
                <div className="space-y-4">
                  {groupedApplications.active.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Applications */}
            {groupedApplications.completed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Completed Applications ({groupedApplications.completed.length})
                </h2>
                <div className="space-y-4">
                  {groupedApplications.completed.map((application) => (
                    <ApplicationCard key={application.id} application={application} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <Modal
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          title={selectedApplication.job.title}
          size="lg"
        >
          <div className="space-y-6">
            {/* Job Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar
                  src={selectedApplication.job.employer.employerProfile.logo}
                  name={selectedApplication.job.employer.employerProfile.companyName}
                  size="lg"
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {selectedApplication.job.title}
                  </h3>
                  <div className="flex items-center space-x-2">
                    <p className="text-primary-600 dark:text-primary-400 font-medium">
                      {selectedApplication.job.employer.employerProfile.companyName}
                    </p>
                    {selectedApplication.job.employer.employerProfile.isVerified && (
                      <Badge variant="success" size="sm">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <Badge className={`${getStatusColor(selectedApplication.status)} text-white border-0`}>
                {getStatusLabel(selectedApplication.status)}
              </Badge>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Applied:</span>
                <span className="ml-2 font-medium">{formatRelativeTime(selectedApplication.appliedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Last Updated:</span>
                <span className="ml-2 font-medium">{formatRelativeTime(selectedApplication.updatedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Availability:</span>
                <span className="ml-2 font-medium">{selectedApplication.availability}</span>
              </div>
              {selectedApplication.proposedRate && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Proposed Rate:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedApplication.proposedRate)}/hr</span>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Your Cover Letter</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedApplication.coverLetter}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" asChild>
                <Link href={`/jobs/${selectedApplication.job.id}`}>
                  View Job
                </Link>
              </Button>
              
              <div className="flex items-center space-x-2">
                {selectedApplication.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50"
                    onClick={() => handleWithdrawApplication(selectedApplication.id)}
                  >
                    Withdraw Application
                  </Button>
                )}
                
                {selectedApplication.status === 'ACCEPTED' && (
                  <Button className="bg-green-600 hover:bg-green-700">
                    Contact Employer
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}