"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatCurrency, formatRelativeTime, truncateText } from '@/lib/utils'

interface Freelancer {
  id: string
  lastActive: string
  profile: {
    firstName: string
    lastName: string
    avatar?: string
    bio?: string
    location?: string
    country: string
  }
  freelancerProfile: {
    id: string
    title: string
    hourlyRate: number
    availability: string
    experienceYears: number
    totalEarned: number
    totalJobs: number
    avgRating: number
    successRate: number
    responseTime: number
    completionRate: number
    topSkills: Array<{
      skill: {
        name: string
      }
      yearsExperience: number
      level: string
    }>
    education: Array<{
      institution: string
      degree: string
      field: string
    }>
    experience: Array<{
      company: string
      position: string
      isCurrent: boolean
    }>
  }
  reviewsReceived: Array<{
    rating: number
    title: string
    comment: string
    author: {
      profile: {
        firstName: string
        lastName: string
      }
      employerProfile: {
        companyName: string
      }
    }
  }>
}

interface FreelancersResponse {
  freelancers: Freelancer[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const availabilityOptions = [
  { value: '', label: 'All Availability' },
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
]

const sortOptions = [
  { value: 'lastActive', label: 'Recently Active' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'rate', label: 'Hourly Rate' },
  { value: 'experience', label: 'Most Experienced' },
  { value: 'earnings', label: 'Top Earners' },
]

const sortOrderOptions = [
  { value: 'desc', label: 'Descending' },
  { value: 'asc', label: 'Ascending' },
]

export default function TalentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [freelancers, setFreelancers] = useState<Freelancer[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [minRate, setMinRate] = useState(searchParams.get('minRate') || '')
  const [maxRate, setMaxRate] = useState(searchParams.get('maxRate') || '')
  const [skillsFilter, setSkillsFilter] = useState(searchParams.get('skills') || '')
  const [availability, setAvailability] = useState(searchParams.get('availability') || '')
  const [minExperience, setMinExperience] = useState(searchParams.get('minExperience') || '')
  const [maxExperience, setMaxExperience] = useState(searchParams.get('maxExperience') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'lastActive')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc')

  const currentPage = parseInt(searchParams.get('page') || '1')

  const fetchFreelancers = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sortBy,
        sortOrder,
        ...(search && { search }),
        ...(location && { location }),
        ...(minRate && { minRate }),
        ...(maxRate && { maxRate }),
        ...(skillsFilter && { skills: skillsFilter }),
        ...(availability && { availability }),
        ...(minExperience && { minExperience }),
        ...(maxExperience && { maxExperience })
      })

      const response = await fetch(`/api/talent?${params}`)
      if (response.ok) {
        const data: FreelancersResponse = await response.json()
        setFreelancers(data.freelancers)
        setPagination(data.pagination)
      }
    } catch (error) {
      console.error('Error fetching freelancers:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateURL = (newFilters: Record<string, string>) => {
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    const newURL = `/talent${params.toString() ? `?${params.toString()}` : ''}`
    router.replace(newURL)
  }

  const handleFilterChange = () => {
    const filters = {
      search,
      location,
      minRate,
      maxRate,
      skills: skillsFilter,
      availability,
      minExperience,
      maxExperience,
      sortBy,
      sortOrder,
      page: '1'
    }
    
    updateURL(filters)
    fetchFreelancers(1)
  }

  const clearFilters = () => {
    setSearch('')
    setLocation('')
    setMinRate('')
    setMaxRate('')
    setSkillsFilter('')
    setAvailability('')
    setMinExperience('')
    setMaxExperience('')
    setSortBy('lastActive')
    setSortOrder('desc')
    
    router.replace('/talent')
    fetchFreelancers(1)
  }

  const handlePageChange = (newPage: number) => {
    const filters = {
      search,
      location,
      minRate,
      maxRate,
      skills: skillsFilter,
      availability,
      minExperience,
      maxExperience,
      sortBy,
      sortOrder,
      page: newPage.toString()
    }
    
    updateURL(filters)
    fetchFreelancers(newPage)
  }

  useEffect(() => {
    fetchFreelancers(currentPage)
  }, [])

  const FreelancerCard = ({ freelancer }: { freelancer: Freelancer }) => (
    <Card hover className="transition-all duration-200 h-full">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <Avatar
            src={freelancer.profile.avatar}
            name={`${freelancer.profile.firstName} ${freelancer.profile.lastName}`}
            size="xl"
            className="mx-auto mb-3"
          />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            {freelancer.profile.firstName} {freelancer.profile.lastName}
          </h3>
          <p className="text-lg font-medium text-primary-600 dark:text-primary-400">
            {freelancer.freelancerProfile.title}
          </p>
          <div className="flex items-center justify-center space-x-2 mt-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {freelancer.profile.location || freelancer.profile.country}
            </span>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Active {formatRelativeTime(freelancer.lastActive)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">
              {formatCurrency(freelancer.freelancerProfile.hourlyRate)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">per hour</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <div className="text-2xl font-bold text-yellow-500">
                {freelancer.freelancerProfile.avgRating.toFixed(1)}
              </div>
              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {freelancer.reviewsReceived.length} reviews
            </div>
          </div>
        </div>

        {freelancer.profile.bio && (
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-3">
            {truncateText(freelancer.profile.bio, 120)}
          </p>
        )}

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Experience:</span>
            <span className="font-medium">{freelancer.freelancerProfile.experienceYears} years</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Success Rate:</span>
            <span className="font-medium text-green-600">{freelancer.freelancerProfile.successRate}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Jobs Completed:</span>
            <span className="font-medium">{freelancer.freelancerProfile.totalJobs}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 dark:text-gray-400">Response Time:</span>
            <span className="font-medium">{freelancer.freelancerProfile.responseTime}h</span>
          </div>
        </div>

        {freelancer.freelancerProfile.topSkills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Top Skills</h4>
            <div className="flex flex-wrap gap-1">
              {freelancer.freelancerProfile.topSkills.slice(0, 4).map((skill) => (
                <Badge key={skill.skill.name} size="sm" variant="primary">
                  {skill.skill.name}
                </Badge>
              ))}
              {freelancer.freelancerProfile.topSkills.length > 4 && (
                <Badge size="sm" variant="outline">
                  +{freelancer.freelancerProfile.topSkills.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Badge variant="outline" size="sm">
            {freelancer.freelancerProfile.availability}
          </Badge>
          <div className="flex-1"></div>
          <div className="text-xs text-gray-500">
            {freelancer.freelancerProfile.completionRate}% complete
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button asChild size="sm" className="flex-1">
              <Link href={`/talent/${freelancer.id}`}>View Profile</Link>
            </Button>
            <Button variant="outline" size="sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </Button>
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
              Find Top Talent
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Connect with pre-vetted professionals ready for full-time remote work
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
                  placeholder="Name, title, skills..."
                />

                <Input
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, state, country..."
                />

                <Select
                  label="Availability"
                  options={availabilityOptions}
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Min Rate"
                    type="number"
                    value={minRate}
                    onChange={(e) => setMinRate(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Max Rate"
                    type="number"
                    value={maxRate}
                    onChange={(e) => setMaxRate(e.target.value)}
                    placeholder="∞"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Min Experience"
                    type="number"
                    value={minExperience}
                    onChange={(e) => setMinExperience(e.target.value)}
                    placeholder="0"
                  />
                  <Input
                    label="Max Experience"
                    type="number"
                    value={maxExperience}
                    onChange={(e) => setMaxExperience(e.target.value)}
                    placeholder="∞"
                  />
                </div>

                <Input
                  label="Skills"
                  value={skillsFilter}
                  onChange={(e) => setSkillsFilter(e.target.value)}
                  placeholder="React, Node.js, Python..."
                />

                <Select
                  label="Sort By"
                  options={sortOptions}
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                />

                <Select
                  label="Order"
                  options={sortOrderOptions}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                />

                <Button onClick={handleFilterChange} className="w-full">
                  Apply Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Freelancers Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                {loading ? 'Loading...' : `${pagination.total} professionals found`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : freelancers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No talent found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button onClick={clearFilters}>Clear Filters</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {freelancers.map((freelancer) => (
                    <FreelancerCard key={freelancer.id} freelancer={freelancer} />
                  ))}
                </div>
                
                <Pagination />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}