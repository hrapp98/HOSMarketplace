"use client"

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatRelativeTime } from '@/lib/utils'

interface FreelancerProfile {
  id: string
  email: string
  lastActive: string
  profile: {
    firstName: string
    lastName: string
    avatar?: string
    bio?: string
    location?: string
    country: string
    phone?: string
    website?: string
    socialLinks?: Record<string, string>
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
    languages: Array<{
      name: string
      proficiency: string
    }>
    skills: Array<{
      skill: {
        name: string
        category: string
      }
      yearsExperience: number
      level: string
    }>
    education: Array<{
      id: string
      institution: string
      degree: string
      field: string
      startDate: string
      endDate?: string
      description?: string
    }>
    experience: Array<{
      id: string
      company: string
      position: string
      startDate: string
      endDate?: string
      isCurrent: boolean
      description?: string
      location?: string
    }>
    portfolio: Array<{
      id: string
      title: string
      description: string
      url?: string
      imageUrl?: string
      category: string
      technologies: string[]
      completedAt: string
    }>
    certifications: Array<{
      id: string
      name: string
      issuer: string
      issuedAt: string
      expiresAt?: string
      credentialUrl?: string
    }>
  }
  reviewsReceived: Array<{
    id: string
    rating: number
    title: string
    comment: string
    createdAt: string
    author: {
      profile: {
        firstName: string
        lastName: string
        avatar?: string
      }
      employerProfile: {
        companyName: string
        logo?: string
      }
    }
    job: {
      title: string
    }
  }>
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  url?: string
  imageUrl?: string
  category: string
  technologies: string[]
  completedAt: string
}

export default function FreelancerProfilePage() {
  const params = useParams()
  const [freelancer, setFreelancer] = useState<FreelancerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPortfolioItem, setSelectedPortfolioItem] = useState<PortfolioItem | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)

  useEffect(() => {
    fetchFreelancer()
  }, [params.id])

  const fetchFreelancer = async () => {
    try {
      const response = await fetch(`/api/talent/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setFreelancer(data)
      }
    } catch (error) {
      console.error('Error fetching freelancer:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHire = () => {
    // Navigate to job posting with pre-filled freelancer info
    window.location.href = `/employer/jobs/new?freelancer=${params.id}`
  }

  const handleMessage = async () => {
    try {
      // Create or get existing conversation
      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantId: params.id
        })
      })

      if (response.ok) {
        const data = await response.json()
        // Redirect to messages page with the conversation
        window.location.href = `/messages?conversation=${data.conversation.id}`
      } else {
        setShowMessageModal(true) // Fallback to modal
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
      setShowMessageModal(true) // Fallback to modal
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!freelancer) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Freelancer not found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The freelancer profile you're looking for doesn't exist.
            </p>
            <Button onClick={() => window.history.back()}>
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'experience', label: 'Experience' },
    { id: 'reviews', label: 'Reviews' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <Avatar
                src={freelancer.profile.avatar}
                name={`${freelancer.profile.firstName} ${freelancer.profile.lastName}`}
                size="2xl"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    {freelancer.profile.firstName} {freelancer.profile.lastName}
                  </h1>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Online
                    </span>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-primary-600 dark:text-primary-400 mb-3">
                  {freelancer.freelancerProfile.title}
                </h2>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {freelancer.profile.location || freelancer.profile.country}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Last active {formatRelativeTime(freelancer.lastActive)}
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m8 0V8a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m0 0v-.5A1.5 1.5 0 018 4h8a1.5 1.5 0 011.5 1.5V6" />
                    </svg>
                    {freelancer.freelancerProfile.experienceYears} years experience
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{freelancer.freelancerProfile.availability}</Badge>
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= freelancer.freelancerProfile.avgRating
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
                    <span className="text-sm font-medium">
                      {freelancer.freelancerProfile.avgRating.toFixed(1)} ({freelancer.reviewsReceived.length} reviews)
                    </span>
                  </div>
                </div>

                {freelancer.profile.bio && (
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {freelancer.profile.bio}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="text-center sm:text-right mb-4 sm:mb-0">
                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {formatCurrency(freelancer.freelancerProfile.hourlyRate)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">per hour</div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button onClick={handleHire} size="lg" className="w-full sm:w-auto">
                  Hire Now
                </Button>
                <Button onClick={handleMessage} variant="outline" size="lg" className="w-full sm:w-auto">
                  Message
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {freelancer.freelancerProfile.totalJobs}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Jobs Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {freelancer.freelancerProfile.successRate}%
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {freelancer.freelancerProfile.responseTime}h
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(freelancer.freelancerProfile.totalEarned)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Section */}
      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Skills */}
                <Card>
                  <CardHeader>
                    <CardTitle>Skills & Expertise</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {freelancer.freelancerProfile.skills.map((skill) => (
                        <div key={skill.skill.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {skill.skill.name}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {skill.yearsExperience} years • {skill.level}
                            </div>
                          </div>
                          <Badge variant="outline" size="sm">
                            {skill.skill.category}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Languages */}
                {freelancer.freelancerProfile.languages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Languages</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {freelancer.freelancerProfile.languages.map((language) => (
                          <div key={language.name} className="flex items-center justify-between">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {language.name}
                            </span>
                            <Badge variant="outline" size="sm">
                              {language.proficiency}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Certifications */}
                {freelancer.freelancerProfile.certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Certifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {freelancer.freelancerProfile.certifications.map((cert) => (
                          <div key={cert.id} className="border-l-4 border-primary-500 pl-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                  {cert.name}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {cert.issuer} • {new Date(cert.issuedAt).getFullYear()}
                                  {cert.expiresAt && ` - ${new Date(cert.expiresAt).getFullYear()}`}
                                </p>
                              </div>
                              {cert.credentialUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                                    View
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {freelancer.freelancerProfile.portfolio.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No portfolio items to display.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {freelancer.freelancerProfile.portfolio.map((item) => (
                          <div
                            key={item.id}
                            className="group cursor-pointer"
                            onClick={() => setSelectedPortfolioItem(item)}
                          >
                            <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700 aspect-video mb-3">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={item.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 transition-colors">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {item.description.substring(0, 100)}...
                            </p>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.technologies.slice(0, 3).map((tech) => (
                                <Badge key={tech} size="sm" variant="outline">
                                  {tech}
                                </Badge>
                              ))}
                              {item.technologies.length > 3 && (
                                <Badge size="sm" variant="outline">
                                  +{item.technologies.length - 3}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTime(item.completedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-6">
                {/* Work Experience */}
                <Card>
                  <CardHeader>
                    <CardTitle>Work Experience</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {freelancer.freelancerProfile.experience.map((exp) => (
                        <div key={exp.id} className="relative">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V8a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m0 0v-.5A1.5 1.5 0 018 4h8a1.5 1.5 0 011.5 1.5V6" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {exp.position}
                                  </h4>
                                  <p className="text-md text-primary-600 dark:text-primary-400 font-medium">
                                    {exp.company}
                                  </p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(exp.startDate).getFullYear()} - {exp.isCurrent ? 'Present' : new Date(exp.endDate!).getFullYear()}
                                    {exp.location && ` • ${exp.location}`}
                                  </p>
                                </div>
                                {exp.isCurrent && (
                                  <Badge variant="success" size="sm">Current</Badge>
                                )}
                              </div>
                              {exp.description && (
                                <p className="text-gray-600 dark:text-gray-400 mt-3">
                                  {exp.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Education */}
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {freelancer.freelancerProfile.education.map((edu) => (
                        <div key={edu.id} className="relative">
                          <div className="flex items-start space-x-4">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {edu.degree} in {edu.field}
                              </h4>
                              <p className="text-md text-blue-600 dark:text-blue-400 font-medium">
                                {edu.institution}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                              </p>
                              {edu.description && (
                                <p className="text-gray-600 dark:text-gray-400 mt-2">
                                  {edu.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Client Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {freelancer.reviewsReceived.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400">
                          No reviews yet.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {freelancer.reviewsReceived.map((review) => (
                          <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                            <div className="flex items-start space-x-4">
                              <Avatar
                                src={review.author.profile.avatar}
                                name={`${review.author.profile.firstName} ${review.author.profile.lastName}`}
                                size="md"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-white">
                                      {review.author.profile.firstName} {review.author.profile.lastName}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {review.author.employerProfile.companyName}
                                    </p>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="flex">
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <svg
                                          key={star}
                                          className={`w-4 h-4 ${
                                            star <= review.rating
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
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                      {formatRelativeTime(review.createdAt)}
                                    </span>
                                  </div>
                                </div>
                                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                                  {review.title}
                                </h5>
                                <p className="text-gray-600 dark:text-gray-400 mb-2">
                                  {review.comment}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Job: {review.job.title}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-400">{freelancer.email}</span>
                </div>
                
                {freelancer.profile.phone && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="text-gray-600 dark:text-gray-400">{freelancer.profile.phone}</span>
                  </div>
                )}
                
                {freelancer.profile.website && (
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9m0 9c-5 0-9-4-9-9s4-9 9-9" />
                    </svg>
                    <a
                      href={freelancer.profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 dark:text-primary-400 hover:underline"
                    >
                      {freelancer.profile.website}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Profile Completion</span>
                  <span className="font-medium">{freelancer.freelancerProfile.completionRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Member Since</span>
                  <span className="font-medium">2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response Rate</span>
                  <span className="font-medium">100%</span>
                </div>
              </CardContent>
            </Card>

            {/* Similar Freelancers */}
            <Card>
              <CardHeader>
                <CardTitle>Similar Freelancers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Browse other talented professionals with similar skills.
                </p>
                <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                  <a href="/talent">View More Talent</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Portfolio Modal */}
      {selectedPortfolioItem && (
        <Modal
          isOpen={!!selectedPortfolioItem}
          onClose={() => setSelectedPortfolioItem(null)}
          title={selectedPortfolioItem.title}
          size="lg"
        >
          <div className="space-y-4">
            {selectedPortfolioItem.imageUrl && (
              <div className="aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                <img
                  src={selectedPortfolioItem.imageUrl}
                  alt={selectedPortfolioItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{selectedPortfolioItem.category}</Badge>
              {selectedPortfolioItem.technologies.map((tech) => (
                <Badge key={tech} size="sm" variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400">
              {selectedPortfolioItem.description}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Completed {formatRelativeTime(selectedPortfolioItem.completedAt)}
              </span>
              {selectedPortfolioItem.url && (
                <Button size="sm" asChild>
                  <a href={selectedPortfolioItem.url} target="_blank" rel="noopener noreferrer">
                    View Project
                  </a>
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <Modal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          title={`Message ${freelancer.profile.firstName}`}
        >
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Send a message to start a conversation with this freelancer.
          </p>
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Messaging system coming soon!
            </p>
          </div>
        </Modal>
      )}
    </div>
  )
}