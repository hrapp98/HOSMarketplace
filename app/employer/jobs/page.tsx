"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface Job {
  id: string
  title: string
  description: string
  employmentType: string
  experienceLevel: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  location?: string
  isRemote: boolean
  status: string
  publishedAt: string
  expiresAt?: string
  viewCount: number
  applicationCount: number
  skills: Array<{
    skill: {
      name: string
    }
    isRequired: boolean
  }>
}

interface JobsResponse {
  jobs: Job[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function EmployerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    draft: 0,
    filled: 0
  })

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/employer/jobs')
      if (response.ok) {
        const data: JobsResponse = await response.json()
        setJobs(data.jobs)
        
        // Calculate stats
        const stats = data.jobs.reduce((acc, job) => {
          acc.total++
          if (job.status === 'ACTIVE') acc.active++
          else if (job.status === 'DRAFT') acc.draft++
          else if (job.status === 'FILLED') acc.filled++
          return acc
        }, { total: 0, active: 0, draft: 0, filled: 0 })
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-500'
      case 'DRAFT':
        return 'bg-yellow-500'
      case 'FILLED':
        return 'bg-blue-500'
      case 'CANCELLED':
        return 'bg-red-500'
      case 'EXPIRED':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active'
      case 'DRAFT':
        return 'Draft'
      case 'FILLED':
        return 'Filled'
      case 'CANCELLED':
        return 'Cancelled'
      case 'EXPIRED':
        return 'Expired'
      default:
        return status
    }
  }

  const getSalaryRange = (job: Job) => {
    if (job.salaryMin && job.salaryMax) {
      return `${formatCurrency(job.salaryMin, job.currency)} - ${formatCurrency(job.salaryMax, job.currency)}/hr`
    } else if (job.salaryMin) {
      return `From ${formatCurrency(job.salaryMin, job.currency)}/hr`
    } else if (job.salaryMax) {
      return `Up to ${formatCurrency(job.salaryMax, job.currency)}/hr`
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const JobCard = ({ job }: { job: Job }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {job.title}
              </h3>
              <Badge className={`${getStatusColor(job.status)} text-white border-0`}>
                {getStatusLabel(job.status)}
              </Badge>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
              {job.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
            </p>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge variant="outline" size="sm">{job.employmentType}</Badge>
              <Badge variant="outline" size="sm">{job.experienceLevel}</Badge>
              {job.isRemote ? (
                <Badge variant="primary" size="sm">Remote</Badge>
              ) : (
                <Badge variant="secondary" size="sm">{job.location}</Badge>
              )}
              {getSalaryRange(job) && (
                <Badge variant="success" size="sm">{getSalaryRange(job)}</Badge>
              )}
            </div>

            {job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {job.skills.slice(0, 4).map((jobSkill) => (
                  <Badge key={jobSkill.skill.name} size="xs" variant="default">
                    {jobSkill.skill.name}
                  </Badge>
                ))}
                {job.skills.length > 4 && (
                  <Badge size="xs" variant="default">
                    +{job.skills.length - 4} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white">
              {job.applicationCount}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Applications</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white">
              {job.viewCount}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Views</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-gray-900 dark:text-white">
              {formatRelativeTime(job.publishedAt)}
            </div>
            <div className="text-gray-500 dark:text-gray-400">Posted</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Button size="sm" asChild>
              <Link href={`/jobs/${job.id}`}>
                View Job
              </Link>
            </Button>
            
            {job.status === 'ACTIVE' && job.applicationCount > 0 && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/employer/jobs/${job.id}/applications`}>
                  Applications ({job.applicationCount})
                </Link>
              </Button>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {job.status === 'DRAFT' && (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/employer/jobs/${job.id}/edit`}>
                  Edit
                </Link>
              </Button>
            )}
            
            <Button size="sm" variant="ghost">
              •••
            </Button>
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
                My Job Postings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your job postings and review applications
              </p>
            </div>
            
            <Button asChild>
              <Link href="/employer/jobs/new">Post a Job</Link>
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
                {stats.total}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats.active}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {stats.draft}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Drafts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.filled}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Filled</div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="container-max section-padding py-8">
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V8a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m0 0v-.5A1.5 1.5 0 008 4h8a1.5 1.5 0 011.5 1.5V6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No job postings yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first job posting to start finding talented freelancers.
              </p>
              <Button asChild>
                <Link href="/employer/jobs/new">Post Your First Job</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}