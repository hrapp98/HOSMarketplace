"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  applicant: {
    id: string
    profile: {
      firstName: string
      lastName: string
      avatar?: string
      location?: string
      country: string
    }
    freelancerProfile: {
      title: string
      hourlyRate: number
      experienceYears: number
      avgRating: number
      totalJobs: number
      successRate: number
      topSkills: Array<{
        skill: {
          name: string
        }
        yearsExperience: number
        level: string
      }>
    }
    reviewsReceived: Array<{
      rating: number
    }>
  }
}

interface JobWithApplications {
  id: string
  title: string
  status: string
  publishedAt: string
  applicationCount: number
  applications: Application[]
}

export default function JobApplicationsPage() {
  const params = useParams()
  const [job, setJob] = useState<JobWithApplications | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('recent')

  useEffect(() => {
    fetchJobApplications()
  }, [params.id])

  const fetchJobApplications = async () => {
    try {
      const response = await fetch(`/api/employer/jobs/${params.id}/applications`)
      if (response.ok) {
        const data = await response.json()
        setJob(data)
      }
    } catch (error) {
      console.error('Error fetching applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/employer/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        // Update local state
        setJob(prev => {
          if (!prev) return null
          return {
            ...prev,
            applications: prev.applications.map(app =>
              app.id === applicationId ? { ...app, status: newStatus } : app
            )
          }
        })
        
        if (selectedApplication?.id === applicationId) {
          setSelectedApplication(prev => prev ? { ...prev, status: newStatus } : null)
        }
      } else {
        alert('Failed to update application status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert('Failed to update application status')
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
        return 'Interview'
      case 'ACCEPTED':
        return 'Accepted'
      case 'REJECTED':
        return 'Rejected'
      case 'WITHDRAWN':
        return 'Withdrawn'
      default:
        return status
    }
  }

  const filteredApplications = job?.applications.filter(app => {
    if (statusFilter === 'all') return true
    return app.status === statusFilter
  }) || []

  const sortedApplications = [...filteredApplications].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      case 'rating':
        return b.applicant.freelancerProfile.avgRating - a.applicant.freelancerProfile.avgRating
      case 'experience':
        return b.applicant.freelancerProfile.experienceYears - a.applicant.freelancerProfile.experienceYears
      case 'rate':
        return (a.proposedRate || a.applicant.freelancerProfile.hourlyRate) - 
               (b.proposedRate || b.applicant.freelancerProfile.hourlyRate)
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Job not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The job posting you're looking for doesn't exist.
            </p>
            <Link href="/employer/jobs">
              <Button>Back to Jobs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const ApplicationCard = ({ application }: { application: Application }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedApplication(application)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar
              src={application.applicant.profile.avatar}
              name={`${application.applicant.profile.firstName} ${application.applicant.profile.lastName}`}
              size="lg"
            />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {application.applicant.profile.firstName} {application.applicant.profile.lastName}
              </h3>
              <p className="text-primary-600 dark:text-primary-400 font-medium">
                {application.applicant.freelancerProfile.title}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {application.applicant.profile.location || application.applicant.profile.country}
                </span>
                <span className="text-gray-400">•</span>
                <div className="flex items-center space-x-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-3 h-3 ${
                          star <= application.applicant.freelancerProfile.avgRating
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-medium">
                    {application.applicant.freelancerProfile.avgRating.toFixed(1)} ({application.applicant.reviewsReceived.length})
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className={`${getStatusColor(application.status)} text-white border-0`}>
              {getStatusLabel(application.status)}
            </Badge>
            <div className="text-right">
              <div className="text-lg font-bold text-primary-600">
                {formatCurrency(application.proposedRate || application.applicant.freelancerProfile.hourlyRate)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">per hour</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white">
              {application.applicant.freelancerProfile.experienceYears}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Years Exp.</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white">
              {application.applicant.freelancerProfile.totalJobs}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Jobs Done</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-green-600">
              {application.applicant.freelancerProfile.successRate}%
            </div>
            <div className="text-gray-500 dark:text-gray-400">Success</div>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
          {application.coverLetter}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {application.applicant.freelancerProfile.topSkills.slice(0, 3).map((skill) => (
              <Badge key={skill.skill.name} size="sm" variant="outline">
                {skill.skill.name}
              </Badge>
            ))}
            {application.applicant.freelancerProfile.topSkills.length > 3 && (
              <Badge size="sm" variant="outline">
                +{application.applicant.freelancerProfile.topSkills.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Applied {formatRelativeTime(application.appliedAt)}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-6">
          <div className="flex items-center justify-between">
            <div>
              <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
                <Link href="/employer/jobs" className="hover:text-gray-700 dark:hover:text-gray-300">
                  Jobs
                </Link>
                <span>/</span>
                <span className="text-gray-900 dark:text-white">{job.title}</span>
              </nav>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Applications for {job.title}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {job.applicationCount} applications • Posted {formatRelativeTime(job.publishedAt)}
              </p>
            </div>
            
            <Link href={`/jobs/${job.id}`}>
              <Button variant="outline">View Job</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Status:
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
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="recent">Most Recent</option>
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="rate">Lowest Rate</option>
                </select>
              </div>
            </div>

            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {sortedApplications.length} of {job.applicationCount} applications
            </div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="container-max section-padding py-8">
        {sortedApplications.length === 0 ? (
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
              <p className="text-gray-600 dark:text-gray-400">
                {statusFilter === 'all' 
                  ? "No one has applied to this job yet."
                  : `No applications with status "${getStatusLabel(statusFilter)}".`
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedApplications.map((application) => (
              <ApplicationCard key={application.id} application={application} />
            ))}
          </div>
        )}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <Modal
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          title={`${selectedApplication.applicant.profile.firstName} ${selectedApplication.applicant.profile.lastName}`}
          size="lg"
        >
          <div className="space-y-6">
            {/* Applicant Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={selectedApplication.applicant.profile.avatar}
                  name={`${selectedApplication.applicant.profile.firstName} ${selectedApplication.applicant.profile.lastName}`}
                  size="xl"
                />
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedApplication.applicant.profile.firstName} {selectedApplication.applicant.profile.lastName}
                  </h3>
                  <p className="text-lg text-primary-600 dark:text-primary-400 font-medium">
                    {selectedApplication.applicant.freelancerProfile.title}
                  </p>
                  <p className="text-gray-500 dark:text-gray-400">
                    {selectedApplication.applicant.profile.location || selectedApplication.applicant.profile.country}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {formatCurrency(selectedApplication.proposedRate || selectedApplication.applicant.freelancerProfile.hourlyRate)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">per hour</div>
              </div>
            </div>

            {/* Application Details */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedApplication.applicant.freelancerProfile.avgRating.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Rating</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedApplication.applicant.freelancerProfile.experienceYears}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {selectedApplication.applicant.freelancerProfile.successRate}%
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Cover Letter</h4>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedApplication.coverLetter}
                </p>
              </div>
            </div>

            {/* Skills */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApplication.applicant.freelancerProfile.topSkills.map((skill) => (
                  <Badge key={skill.skill.name} variant="outline">
                    {skill.skill.name} • {skill.yearsExperience}y • {skill.level}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Application Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Applied:</span>
                <span className="ml-2 font-medium">{formatRelativeTime(selectedApplication.appliedAt)}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Availability:</span>
                <span className="ml-2 font-medium">{selectedApplication.availability}</span>
              </div>
            </div>

            {/* Status Update Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Status:
                </span>
                <Badge className={`${getStatusColor(selectedApplication.status)} text-white border-0`}>
                  {getStatusLabel(selectedApplication.status)}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                {selectedApplication.status === 'PENDING' && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(selectedApplication.id, 'SHORTLISTED')}
                    >
                      Shortlist
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleStatusChange(selectedApplication.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {selectedApplication.status === 'SHORTLISTED' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(selectedApplication.id, 'INTERVIEW')}
                    >
                      Interview
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleStatusChange(selectedApplication.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {selectedApplication.status === 'INTERVIEW' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange(selectedApplication.id, 'ACCEPTED')}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleStatusChange(selectedApplication.id, 'REJECTED')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                <Link href={`/talent/${selectedApplication.applicant.id}`}>
                  <Button size="sm" variant="outline">
                    View Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}