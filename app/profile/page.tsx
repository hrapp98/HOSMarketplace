"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FileUpload, UploadedFile } from '@/components/ui/FileUpload'
import { FileDisplay } from '@/components/ui/FileDisplay'

interface FreelancerProfile {
  id: string
  title: string
  hourlyRate: number
  availability: string
  experienceYears: number
  resume?: string
}

interface Profile {
  firstName: string
  lastName: string
  avatar?: string
  bio?: string
  location?: string
  country: string
}

export default function ProfilePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null)
  const [activeTab, setActiveTab] = useState('basic')
  const [error, setError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    if (session) {
      fetchProfile()
    } else {
      router.push('/auth/signin')
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        if (data.freelancerProfile) {
          setFreelancerProfile(data.freelancerProfile)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file: UploadedFile) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            avatar: file.url
          }
        }),
      })

      if (response.ok) {
        setProfile(prev => prev ? { ...prev, avatar: file.url } : null)
        setUploadError(null)
      } else {
        const data = await response.json()
        setUploadError(data.error || 'Failed to update avatar')
      }
    } catch (error) {
      console.error('Error updating avatar:', error)
      setUploadError('Failed to update avatar')
    }
  }

  const handleResumeUpload = async (file: UploadedFile) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          freelancerProfile: {
            resume: file.url
          }
        }),
      })

      if (response.ok) {
        setFreelancerProfile(prev => prev ? { ...prev, resume: file.url } : null)
        setUploadError(null)
      } else {
        const data = await response.json()
        setUploadError(data.error || 'Failed to update resume')
      }
    } catch (error) {
      console.error('Error updating resume:', error)
      setUploadError('Failed to update resume')
    }
  }

  const handleProfileSubmit = async (formData: Record<string, unknown>) => {
    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
        if (data.freelancerProfile) {
          setFreelancerProfile(data.freelancerProfile)
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      setError('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'professional', label: 'Professional' },
    { id: 'files', label: 'Files & Documents' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Profile Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your profile information and preferences
              </p>
            </div>
            <Badge variant={profile ? 'success' : 'warning'}>
              {profile ? 'Complete' : 'Incomplete'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="container-max section-padding py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Upload Error Message */}
            {uploadError && (
              <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-600 dark:text-red-400">{uploadError}</p>
              </div>
            )}

            {/* Files & Documents Tab */}
            {activeTab === 'files' && (
              <div className="space-y-6">
                {/* Avatar Upload */}
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Picture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0">
                        {profile?.avatar ? (
                          <img
                            src={profile.avatar}
                            alt="Profile picture"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-800 shadow-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Upload Profile Picture
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Choose a professional photo that represents you well. This will be visible to potential clients.
                        </p>
                        <FileUpload
                          fileType="avatar"
                          onUpload={handleAvatarUpload}
                          onError={setUploadError}
                          className="max-w-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resume Upload - Only for Freelancers */}
                {session.user.role === 'FREELANCER' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Resume/CV</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Upload your latest resume or CV. This helps clients understand your background and qualifications.
                        </p>
                        
                        {freelancerProfile?.resume ? (
                          <div className="space-y-4">
                            <FileDisplay
                              file={{
                                url: freelancerProfile.resume,
                                original_name: 'Resume.pdf',
                                format: 'pdf',
                                type: 'resume'
                              }}
                              showDelete={true}
                              onDelete={() => {
                                setFreelancerProfile(prev => prev ? { ...prev, resume: undefined } : null)
                                handleProfileSubmit({ freelancerProfile: { resume: null } })
                              }}
                            />
                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                                Update Resume
                              </h4>
                              <FileUpload
                                fileType="resume"
                                onUpload={handleResumeUpload}
                                onError={setUploadError}
                                className="max-w-sm"
                              />
                            </div>
                          </div>
                        ) : (
                          <FileUpload
                            fileType="resume"
                            onUpload={handleResumeUpload}
                            onError={setUploadError}
                          />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Portfolio Section - Only for Freelancers */}
                {session.user.role === 'FREELANCER' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Portfolio Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Upload images showcasing your work. High-quality visuals help clients understand your capabilities.
                        </p>
                        
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm">
                              <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                                Portfolio Management
                              </p>
                              <p className="text-blue-700 dark:text-blue-300">
                                Complete portfolio management with project details is available in your dashboard. 
                                This section is for quick image uploads.
                              </p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-3"
                                onClick={() => router.push('/dashboard')}
                              >
                                Manage Full Portfolio
                              </Button>
                            </div>
                          </div>
                        </div>

                        <FileUpload
                          fileType="portfolio"
                          onUpload={(file) => {
                            // This would need to be connected to portfolio creation
                            console.log('Portfolio image uploaded:', file)
                          }}
                          onError={setUploadError}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Other tabs would be implemented here */}
            {activeTab !== 'files' && (
              <Card>
                <CardContent className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Coming Soon
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {activeTab === 'basic' && 'Basic profile information editing will be available soon.'}
                    {activeTab === 'professional' && 'Professional profile settings will be available soon.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}