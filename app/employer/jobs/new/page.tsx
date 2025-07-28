"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface JobFormData {
  title: string
  employmentType: string
  experienceLevel: string
  location: string
  isRemote: boolean
  salaryMin: string
  salaryMax: string
  currency: string
  description: string
  requirements: string[]
  responsibilities: string[]
  skills: string[]
}

const employmentTypes = [
  { value: 'Full-time', label: 'Full-time' },
  { value: 'Part-time', label: 'Part-time' },
  { value: 'Contract', label: 'Contract' },
]

const experienceLevels = [
  { value: 'Entry', label: 'Entry Level (0-2 years)' },
  { value: 'Mid', label: 'Mid Level (2-5 years)' },
  { value: 'Senior', label: 'Senior Level (5+ years)' },
  { value: 'Expert', label: 'Expert Level (10+ years)' },
]

const currencies = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
]

const popularSkills = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java',
  'PHP', 'Ruby', 'Go', 'Rust', 'C++', 'C#', 'Swift', 'Kotlin',
  'Vue.js', 'Angular', 'Svelte', 'Next.js', 'Express.js', 'Django',
  'Flask', 'Ruby on Rails', 'Spring Boot', 'Laravel', 'WordPress',
  'Shopify', 'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'GraphQL', 'REST API',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'Jenkins', 'Docker',
  'Figma', 'Adobe Creative Suite', 'Sketch', 'InVision', 'Principle',
  'Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing',
  'Content Marketing', 'Email Marketing', 'Google Analytics',
  'Customer Support', 'Virtual Assistant', 'Data Entry', 'Accounting',
  'Bookkeeping', 'Project Management', 'Scrum', 'Agile'
]

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentSkill, setCurrentSkill] = useState('')
  const [currentRequirement, setCurrentRequirement] = useState('')
  const [currentResponsibility, setCurrentResponsibility] = useState('')
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false)
  
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    employmentType: 'Full-time',
    experienceLevel: 'Mid',
    location: '',
    isRemote: true,
    salaryMin: '',
    salaryMax: '',
    currency: 'USD',
    description: '',
    requirements: [],
    responsibilities: [],
    skills: []
  })

  const [errors, setErrors] = useState<Partial<JobFormData>>({})

  const handleInputChange = (field: keyof JobFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const addSkill = (skill: string) => {
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }))
    }
    setCurrentSkill('')
    setShowSkillSuggestions(false)
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const addRequirement = () => {
    if (currentRequirement.trim() && !formData.requirements.includes(currentRequirement.trim())) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, currentRequirement.trim()]
      }))
      setCurrentRequirement('')
    }
  }

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }))
  }

  const addResponsibility = () => {
    if (currentResponsibility.trim() && !formData.responsibilities.includes(currentResponsibility.trim())) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, currentResponsibility.trim()]
      }))
      setCurrentResponsibility('')
    }
  }

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<JobFormData> = {}

    if (!formData.title.trim()) newErrors.title = 'Job title is required'
    if (!formData.description.trim()) newErrors.description = 'Job description is required'
    if (!formData.location.trim() && !formData.isRemote) newErrors.location = 'Location is required for non-remote jobs'
    if (formData.salaryMin && formData.salaryMax && parseFloat(formData.salaryMin) > parseFloat(formData.salaryMax)) {
      newErrors.salaryMin = 'Minimum salary cannot be higher than maximum salary'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent, isDraft: boolean = false) => {
    e.preventDefault()

    if (!isDraft && !validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salaryMin: formData.salaryMin ? parseFloat(formData.salaryMin) : null,
          salaryMax: formData.salaryMax ? parseFloat(formData.salaryMax) : null,
          status: isDraft ? 'DRAFT' : 'ACTIVE'
        }),
      })

      if (response.ok) {
        const job = await response.json()
        router.push(`/employer/jobs/${job.id}`)
      } else {
        const error = await response.json()
        console.error('Error creating job:', error)
      }
    } catch (error) {
      console.error('Error creating job:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSkills = popularSkills.filter(skill =>
    skill.toLowerCase().includes(currentSkill.toLowerCase()) &&
    !formData.skills.includes(skill)
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Post a New Job</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Find the perfect candidate for your team by creating a detailed job posting.
        </p>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Job Title *"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g. Senior React Developer"
              error={errors.title}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Employment Type"
                options={employmentTypes}
                value={formData.employmentType}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
              />

              <Select
                label="Experience Level"
                options={experienceLevels}
                value={formData.experienceLevel}
                onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isRemote"
                  checked={formData.isRemote}
                  onChange={(e) => handleInputChange('isRemote', e.target.checked)}
                  className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isRemote" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  This is a remote position
                </label>
              </div>

              {!formData.isRemote && (
                <Input
                  label="Location *"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="e.g. New York, NY"
                  error={errors.location}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Compensation */}
        <Card>
          <CardHeader>
            <CardTitle>Compensation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Minimum Salary (per hour)"
                type="number"
                value={formData.salaryMin}
                onChange={(e) => handleInputChange('salaryMin', e.target.value)}
                placeholder="0"
                error={errors.salaryMin}
              />

              <Input
                label="Maximum Salary (per hour)"
                type="number"
                value={formData.salaryMax}
                onChange={(e) => handleInputChange('salaryMax', e.target.value)}
                placeholder="0"
              />

              <Select
                label="Currency"
                options={currencies}
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Job Description */}
        <Card>
          <CardHeader>
            <CardTitle>Job Description *</CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              content={formData.description}
              onChange={(content) => handleInputChange('description', content)}
              placeholder="Describe the role, company culture, what makes this opportunity exciting..."
              minHeight="300px"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
            )}
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={currentRequirement}
                onChange={(e) => setCurrentRequirement(e.target.value)}
                placeholder="Add a requirement..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" onClick={addRequirement} disabled={!currentRequirement.trim()}>
                Add
              </Button>
            </div>

            {formData.requirements.length > 0 && (
              <div className="space-y-2">
                {formData.requirements.map((requirement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-white">{requirement}</span>
                    <button
                      type="button"
                      onClick={() => removeRequirement(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Responsibilities */}
        <Card>
          <CardHeader>
            <CardTitle>Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={currentResponsibility}
                onChange={(e) => setCurrentResponsibility(e.target.value)}
                placeholder="Add a responsibility..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
              />
              <Button type="button" onClick={addResponsibility} disabled={!currentResponsibility.trim()}>
                Add
              </Button>
            </div>

            {formData.responsibilities.length > 0 && (
              <div className="space-y-2">
                {formData.responsibilities.map((responsibility, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="text-sm text-gray-900 dark:text-white">{responsibility}</span>
                    <button
                      type="button"
                      onClick={() => removeResponsibility(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Skills */}
        <Card>
          <CardHeader>
            <CardTitle>Required Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <div className="flex space-x-2">
                <Input
                  value={currentSkill}
                  onChange={(e) => {
                    setCurrentSkill(e.target.value)
                    setShowSkillSuggestions(e.target.value.length > 0)
                  }}
                  placeholder="Add skills..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(currentSkill))}
                  onFocus={() => setShowSkillSuggestions(currentSkill.length > 0)}
                  onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 200)}
                />
                <Button type="button" onClick={() => addSkill(currentSkill)} disabled={!currentSkill.trim()}>
                  Add
                </Button>
              </div>

              {showSkillSuggestions && filteredSkills.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                  {filteredSkills.slice(0, 10).map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-white"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {formData.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((skill) => (
                  <Badge key={skill} variant="primary" className="flex items-center space-x-1">
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-1 text-primary-600 hover:text-primary-800"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? <LoadingSpinner size="sm" color="white" /> : 'Post Job'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="flex-1"
            >
              Save as Draft
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}