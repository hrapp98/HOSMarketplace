"use client"

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
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
  publishedAt: string
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
  skills: Array<{
    skill: {
      name: string
    }
  }>
  _count: {
    applications: number
  }
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

const employmentTypes = [
  { value: '', label: 'All Types' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
]

const experienceLevels = [
  { value: '', label: 'All Levels' },
  { value: 'Entry', label: 'Entry Level' },
  { value: 'Mid', label: 'Mid Level' },
  { value: 'Senior', label: 'Senior Level' },
  { value: 'Expert', label: 'Expert Level' },
]

const remoteOptions = [
  { value: '', label: 'All Locations' },
  { value: 'true', label: 'Remote Only' },
  { value: 'false', label: 'On-site Only' },
]

export default function JobsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [jobs, setJobs] = useState<Job[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set())
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [employmentType, setEmploymentType] = useState(searchParams.get('employmentType') || '')
  const [experienceLevel, setExperienceLevel] = useState(searchParams.get('experienceLevel') || '')
  const [minSalary, setMinSalary] = useState(searchParams.get('minSalary') || '')
  const [maxSalary, setMaxSalary] = useState(searchParams.get('maxSalary') || '')
  const [isRemote, setIsRemote] = useState(searchParams.get('isRemote') || '')
  const [skillsFilter, setSkillsFilter] = useState(searchParams.get('skills') || '')

  const currentPage = parseInt(searchParams.get('page') || '1')

  const fetchJobs = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(location && { location }),
        ...(employmentType && { employmentType }),
        ...(experienceLevel && { experienceLevel }),
        ...(minSalary && { minSalary }),
        ...(maxSalary && { maxSalary }),
        ...(isRemote && { isRemote }),
        ...(skillsFilter && { skills: skillsFilter })
      })

      const response = await fetch(`/api/jobs?${params}`)
      if (response.ok) {
        const data: JobsResponse = await response.json()
        setJobs(data.jobs)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    const newURL = `/jobs${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newURL)
  }

  const handleFilterChange = () => {
    const filters = {
      search,
      location,
      employmentType,
      experienceLevel,
      minSalary,
      maxSalary,
      isRemote,
      skills: skillsFilter,
      page: '1' // Reset to first page when filters change
    }
    
    updateURL(filters)
    fetchJobs(1)
  }

  const clearFilters = () => {
    setSearch('')
    setLocation('')
    setEmploymentType('')
    setExperienceLevel('')
    setMinSalary('')
    setMaxSalary('')
    setIsRemote('')
    setSkillsFilter('')
    
    router.replace('/jobs')
    fetchJobs(1)
  }

  const handlePageChange = (newPage: number) => {
    const filters = {
      search,
      location,
      employmentType,
      experienceLevel,
      minSalary,
      maxSalary,
      isRemote,
      skills: skillsFilter,
      page: newPage.toString()
    }
    
    updateURL(filters)
    fetchJobs(newPage)
  }

  const toggleSaveJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/save`, {
        method: savedJobs.has(jobId) ? 'DELETE' : 'POST'
      })
      
      if (response.ok) {
        setSavedJobs(prev => {
          const newSet = new Set(prev)
          if (newSet.has(jobId)) {
            newSet.delete(jobId)
          } else {
            newSet.add(jobId)
          }
          return newSet
        })
      }
    } catch (error) {
      console.error('Error toggling save job:', error)
    }
  }

  useEffect(() => {
    fetchJobs(currentPage)
  }, [])

  const getSalaryRange = (job: Job) => {
    if (!job.salaryMin && !job.salaryMax) return null
    
    if (job.salaryMin && job.salaryMax) {
      return `${formatCurrency(job.salaryMin, job.currency)} - ${formatCurrency(job.salaryMax, job.currency)}/hr`
    } else if (job.salaryMin) {
      return `From ${formatCurrency(job.salaryMin, job.currency)}/hr`
    } else if (job.salaryMax) {
      return `Up to ${formatCurrency(job.salaryMax, job.currency)}/hr`
    }
    
    return null
  }

  const JobCard = ({ job }: { job: Job }) => (
    <Card hover className="transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <Avatar
                src={job.employer.employerProfile.logo}
                name={job.employer.employerProfile.companyName}
                size="md"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {job.employer.employerProfile.companyName}
                  </h3>
                  {job.employer.employerProfile.isVerified && (
                    <Badge variant="success" size="sm">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {formatRelativeTime(job.publishedAt)}
                </p>
              </div>
            </div>
            
            <Link href={`/jobs/${job.id}`} className="block group">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors mb-2">
                {job.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                {job.description.replace(/<[^>]*>/g, '').substring(0, 200)}...
              </p>
            </Link>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge variant="outline">{job.employmentType}</Badge>
              <Badge variant="outline">{job.experienceLevel}</Badge>
              {job.isRemote ? (
                <Badge variant="primary">Remote</Badge>
              ) : (
                <Badge variant="secondary">{job.location}</Badge>
              )}
              {getSalaryRange(job) && (
                <Badge variant="success">{getSalaryRange(job)}</Badge>
              )}
            </div>

            {job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {job.skills.slice(0, 5).map((jobSkill) => (
                  <Badge key={jobSkill.skill.name} size="sm" variant="default">
                    {jobSkill.skill.name}
                  </Badge>
                ))}
                {job.skills.length > 5 && (
                  <Badge size="sm" variant="default">
                    +{job.skills.length - 5} more
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {job._count.applications} applications
              </p>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleSaveJob(job.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    savedJobs.has(job.id)
                      ? 'text-red-500 hover:text-red-600'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={savedJobs.has(job.id) ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                
                <Button asChild size="sm">
                  <Link href={`/jobs/${job.id}`}>View Details</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const Pagination = () => {
    if (pagination.pages <= 1) return null

    const pages = Array.from({ length: pagination.pages }, (_, i) => i + 1)
    const showPages = pages.filter(page => 
      page === 1 || 
      page === pagination.pages || 
      Math.abs(page - currentPage) <= 2
    )

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        
        {showPages.map((page, index) => {
          const prevPage = showPages[index - 1]
          const showEllipsis = prevPage && page - prevPage > 1
          
          return (
            <React.Fragment key={page}>
              {showEllipsis && <span className="px-2">...</span>}
              <Button
                variant={page === currentPage ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            </React.Fragment>
          )
        })}
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.pages}
        >
          Next
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Find Your Dream Job
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover amazing remote opportunities with top companies worldwide
            </p>
          </div>
        </div>
      </div>

      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Filters</CardTitle>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Job title, company, keywords..."
                />

                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state, country..."
                />

                <Select
                  label="Employment Type"
                  options={employmentTypes}
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                />

                <Select
                  label="Experience Level"
                  options={experienceLevels}
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                />

                <Select
                  label="Location Type"
                  options={remoteOptions}
                  value={isRemote}
                  onChange={(e) => setIsRemote(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Min Salary"
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Max Salary"
                    type="number"
                    value={maxSalary}
                    onChange={(e) => setMaxSalary(e.target.value)}
                    placeholder="∞"
                  />
                </div>

                <Input
                  label="Skills"
                  value={skillsFilter}
                  onChange={(e) => setSkillsFilter(e.target.value)}
                  placeholder="React, Node.js, Python..."
                />

                <Button onClick={handleFilterChange} className="w-full">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Jobs List */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Loading...' : `${pagination.total} jobs found`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
                
                <Pagination />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}