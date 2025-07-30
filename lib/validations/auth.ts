import { ValidationRule } from '../security'

// Registration validation rules
export const registerValidationRules: ValidationRule[] = [
  {
    field: 'email',
    required: true,
    type: 'email',
    maxLength: 254,
  },
  {
    field: 'password',
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(value)
      const hasLowerCase = /[a-z]/.test(value)
      const hasNumbers = /\d/.test(value)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
      
      if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter'
      }
      if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter'
      }
      if (!hasNumbers) {
        return 'Password must contain at least one number'
      }
      if (!hasSpecialChar) {
        return 'Password must contain at least one special character'
      }
      
      return true
    },
  },
  {
    field: 'role',
    required: true,
    type: 'string',
    custom: (value: string) => {
      const validRoles = ['EMPLOYER', 'FREELANCER']
      return validRoles.includes(value) || 'Role must be either EMPLOYER or FREELANCER'
    },
  },
  {
    field: 'firstName',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  {
    field: 'lastName',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
  },
  {
    field: 'country',
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 2,
    pattern: /^[A-Z]{2}$/,
  },
]

// Login validation rules
export const loginValidationRules: ValidationRule[] = [
  {
    field: 'email',
    required: true,
    type: 'email',
    maxLength: 254,
  },
  {
    field: 'password',
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 128,
  },
]

// Password reset validation rules
export const passwordResetValidationRules: ValidationRule[] = [
  {
    field: 'email',
    required: true,
    type: 'email',
    maxLength: 254,
  },
]

// Change password validation rules
export const changePasswordValidationRules: ValidationRule[] = [
  {
    field: 'currentPassword',
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 128,
  },
  {
    field: 'newPassword',
    required: true,
    type: 'string',
    minLength: 8,
    maxLength: 128,
    custom: (value: string) => {
      // Password strength validation
      const hasUpperCase = /[A-Z]/.test(value)
      const hasLowerCase = /[a-z]/.test(value)
      const hasNumbers = /\d/.test(value)
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value)
      
      if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter'
      }
      if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter'
      }
      if (!hasNumbers) {
        return 'Password must contain at least one number'
      }
      if (!hasSpecialChar) {
        return 'Password must contain at least one special character'
      }
      
      return true
    },
  },
  {
    field: 'confirmPassword',
    required: true,
    type: 'string',
    custom: (value: string, data: any) => {
      return value === data.newPassword || 'Passwords do not match'
    },
  },
]