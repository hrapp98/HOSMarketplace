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
import { Input } from '@/components/ui/Input'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface JobDetails {
  id: string
  title: string
  description: string
  requirements: string[]
  responsibilities: string[]
  employmentType: string
  experienceLevel: string
  salaryMin?: number
  salaryMax?: number
  currency: string
  location?: string
  isRemote: boolean
  publishedAt: string
  viewCount: number
  applicationCount: number
  status: string
  employer: {
    id: string
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
    employerProfile: {
      companyName: string
      companySize?: string
      industry?: string
      website?: string
      description?: string
      logo?: string
      isVerified: boolean
    }
  }
  skills: Array<{
    skill: {
      name: string
      category: string
    }
    isRequired: boolean
  }>
}

interface ApplicationFormData {
  coverLetter: string
  proposedRate: string
  availability: string
}

export default function JobDetailsPage() {
  const params = useParams()
  const [job, setJob] = useState<JobDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationForm, setApplicationForm] = useState<ApplicationFormData>({
    coverLetter: '',
    proposedRate: '',
    availability: 'Full-time'
  })
  const [submitting, setSubmitting] = useState(false)
  const [hasApplied, setHasApplied] = useState(false)

  useEffect(() => {
    fetchJobDetails()
    checkApplicationStatus()
  }, [params.id])

  const fetchJobDetails = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setJob(data)
      }
    } catch (error) {
      console.error('Error fetching job details:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkApplicationStatus = async () => {
    try {
      const response = await fetch(`/api/jobs/${params.id}/application-status`)
      if (response.ok) {
        const data = await response.json()
        setHasApplied(data.hasApplied)
      }
    } catch (error) {
      console.error('Error checking application status:', error)
    }
  }

  const handleApply = () => {
    setShowApplicationModal(true)
  }

  const handleSubmitApplication = async () => {
    if (!applicationForm.coverLetter.trim()) {
      alert('Please write a cover letter')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch(`/api/jobs/${params.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationForm)
      })

      if (response.ok) {
        setShowApplicationModal(false)
        setHasApplied(true)
        setJob(prev => prev ? { ...prev, applicationCount: prev.applicationCount + 1 } : null)
        alert('Application submitted successfully!')
      } else {
        const error = await response.json()
        alert(error.message || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('Failed to submit application')
    } finally {
      setSubmitting(false)
    }
  }

  const getSalaryRange = () => {
    if (!job) return null
    
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

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Job not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The job posting you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/jobs">Browse Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar
                  src={job.employer.employerProfile.logo}
                  name={job.employer.employerProfile.companyName}
                  size="lg"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {job.employer.employerProfile.companyName}
                    </h2>
                    {job.employer.employerProfile.isVerified && (
                      <Badge variant="success" size="sm">Verified</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Posted {formatRelativeTime(job.publishedAt)} • {job.applicationCount} applications
                  </p>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Badge variant="outline">{job.employmentType}</Badge>
                <Badge variant="outline">{job.experienceLevel}</Badge>
                {job.isRemote ? (
                  <Badge variant="primary">Remote</Badge>
                ) : (
                  <Badge variant="secondary">{job.location}</Badge>
                )}
                {getSalaryRange() && (
                  <Badge variant="success">{getSalaryRange()}</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {hasApplied ? (
                <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="text-green-600 dark:text-green-400 font-medium">
                    ✓ Application Submitted
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400">
                    You've already applied to this job
                  </div>
                </div>
              ) : (
                <Button onClick={handleApply} size="lg" className="w-full sm:w-auto">
                  Apply Now
                </Button>
              )}
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Save Job
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Description */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-gray dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </CardContent>
            </Card>

            {/* Responsibilities */}
            {job.responsibilities.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Responsibilities</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 dark:text-gray-300">{responsibility}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Requirements */}
            {job.requirements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {job.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((jobSkill) => (
                      <Badge 
                        key={jobSkill.skill.name} 
                        variant={jobSkill.isRequired ? "primary" : "outline"}
                        size="sm"
                      >
                        {jobSkill.skill.name}
                        {jobSkill.isRequired && <span className="ml-1">*</span>}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    * Required skills
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>About {job.employer.employerProfile.companyName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {job.employer.employerProfile.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {job.employer.employerProfile.description}
                  </p>
                )}
                
                <div className="space-y-2 text-sm">
                  {job.employer.employerProfile.industry && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Industry:</span>
                      <span className="font-medium">{job.employer.employerProfile.industry}</span>
                    </div>
                  )}
                  {job.employer.employerProfile.companySize && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Company Size:</span>
                      <span className="font-medium">{job.employer.employerProfile.companySize}</span>
                    </div>
                  )}
                  {job.employer.employerProfile.website && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Website:</span>
                      <a 
                        href={job.employer.employerProfile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                      >
                        Visit Site
                      </a>
                    </div>
                  )}
                </div>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/employers/${job.employer.id}`}>View Company Profile</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Job Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Job Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Applications:</span>
                  <span className="font-medium">{job.applicationCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Views:</span>
                  <span className="font-medium">{job.viewCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Posted:</span>
                  <span className="font-medium">{formatRelativeTime(job.publishedAt)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Similar Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Browse other opportunities that match your skills.
                </p>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href="/jobs">View More Jobs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <Modal
          isOpen={showApplicationModal}
          onClose={() => setShowApplicationModal(false)}
          title={`Apply to ${job.title}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Applying to: {job.employer.employerProfile.companyName}
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Make sure your application stands out by writing a personalized cover letter.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cover Letter *
              </label>
              <textarea
                value={applicationForm.coverLetter}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, coverLetter: e.target.value }))}
                placeholder="Write a compelling cover letter explaining why you're the perfect fit for this role..."
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {applicationForm.coverLetter.length}/2000 characters
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Proposed Rate ($/hr)"
                type="number"
                value={applicationForm.proposedRate}
                onChange={(e) => setApplicationForm(prev => ({ ...prev, proposedRate: e.target.value }))}
                placeholder="Your hourly rate"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Availability
                </label>
                <select
                  value={applicationForm.availability}
                  onChange={(e) => setApplicationForm(prev => ({ ...prev, availability: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                Application Summary
              </h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>Job: {job.title}</p>
                <p>Company: {job.employer.employerProfile.companyName}</p>
                {applicationForm.proposedRate && (
                  <p>Proposed Rate: ${applicationForm.proposedRate}/hr</p>
                )}
                <p>Availability: {applicationForm.availability}</p>
              </div>
            </div>

            <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowApplicationModal(false)}
                className="flex-1"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApplication}
                className="flex-1"
                disabled={submitting || !applicationForm.coverLetter.trim()}
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}