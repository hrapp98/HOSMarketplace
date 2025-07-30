import { ValidationRule } from '../security'

// Job posting validation rules
export const jobPostingValidationRules: ValidationRule[] = [
  {
    field: 'title',
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 100,
  },
  {
    field: 'description',
    required: true,
    type: 'string',
    minLength: 50,
    maxLength: 5000,
  },
  {
    field: 'skills',
    required: true,
    custom: (value: any) => {
      if (!Array.isArray(value)) {
        return 'Skills must be an array'
      }
      if (value.length === 0) {
        return 'At least one skill is required'
      }
      if (value.length > 20) {
        return 'Maximum 20 skills allowed'
      }
      return true
    },
  },
  {
    field: 'salaryMin',
    required: false,
    type: 'number',
    min: 0,
    max: 1000000,
  },
  {
    field: 'salaryMax',
    required: false,
    type: 'number',
    min: 0,
    max: 1000000,
  },
  {
    field: 'experienceLevel',
    required: true,
    type: 'string',
    custom: (value: string) => {
      const validLevels = ['ENTRY', 'INTERMEDIATE', 'EXPERT']
      return validLevels.includes(value) || 'Invalid experience level'
    },
  },
  {
    field: 'isRemote',
    required: true,
    type: 'boolean',
  },
  {
    field: 'location',
    required: false,
    type: 'string',
    maxLength: 100,
  },
  {
    field: 'contractType',
    required: true,
    type: 'string',
    custom: (value: string) => {
      const validTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE']
      return validTypes.includes(value) || 'Invalid contract type'
    },
  },
]

// Job application validation rules
export const jobApplicationValidationRules: ValidationRule[] = [
  {
    field: 'coverLetter',
    required: true,
    type: 'string',
    minLength: 50,
    maxLength: 2000,
  },
  {
    field: 'proposedRate',
    required: false,
    type: 'number',
    min: 0,
    max: 10000,
  },
  {
    field: 'availability',
    required: false,
    type: 'string',
    maxLength: 100,
  },
]

// Application status validation rules
export const applicationStatusValidationRules: ValidationRule[] = [
  {
    field: 'status',
    required: true,
    type: 'string',
    custom: (value: string) => {
      const validStatuses = ['PENDING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED']
      return validStatuses.includes(value) || 'Invalid application status'
    },
  },
  {
    field: 'message',
    required: false,
    type: 'string',
    maxLength: 1000,
  },
]

// Job search validation rules
export const jobSearchValidationRules: ValidationRule[] = [
  {
    field: 'search',
    required: false,
    type: 'string',
    maxLength: 100,
  },
  {
    field: 'skills',
    required: false,
    type: 'string',
    maxLength: 200,
  },
  {
    field: 'location',
    required: false,
    type: 'string',
    maxLength: 100,
  },
  {
    field: 'experienceLevel',
    required: false,
    type: 'string',
    custom: (value: string) => {
      if (!value) return true
      const validLevels = ['ENTRY', 'INTERMEDIATE', 'EXPERT']
      return validLevels.includes(value) || 'Invalid experience level'
    },
  },
  {
    field: 'minSalary',
    required: false,
    type: 'string',
    pattern: /^\d+$/,
  },
  {
    field: 'maxSalary',
    required: false,
    type: 'string',
    pattern: /^\d+$/,
  },
  {
    field: 'isRemote',
    required: false,
    type: 'string',
    custom: (value: string) => {
      if (!value) return true
      return ['true', 'false'].includes(value) || 'isRemote must be true or false'
    },
  },
  {
    field: 'page',
    required: false,
    type: 'string',
    pattern: /^\d+$/,
  },
  {
    field: 'limit',
    required: false,
    type: 'string',
    pattern: /^\d+$/,
    custom: (value: string) => {
      if (!value) return true
      const num = parseInt(value)
      return (num >= 1 && num <= 100) || 'Limit must be between 1 and 100'
    },
  },
]