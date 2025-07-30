"use client"

import React, { useState, useRef } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

interface FileUploadProps {
  onUpload: (file: UploadedFile) => void
  onError?: (error: string) => void
  fileType: 'resume' | 'portfolio' | 'avatar'
  accept?: string
  maxSize?: number // in MB
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export interface UploadedFile {
  url: string
  public_id: string
  original_name: string
  size: number
  format: string
  type: string
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  onError,
  fileType,
  accept,
  maxSize,
  disabled = false,
  className = "",
  children
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getDefaultAccept = () => {
    switch (fileType) {
      case 'resume':
        return '.pdf,.doc,.docx'
      case 'portfolio':
      case 'avatar':
        return 'image/*'
      default:
        return '*/*'
    }
  }

  const getMaxSize = () => {
    switch (fileType) {
      case 'resume':
        return 10 // 10MB
      case 'portfolio':
        return 5 // 5MB
      case 'avatar':
        return 2 // 2MB
      default:
        return 5 // 5MB
    }
  }

  const defaultMaxSize = maxSize || getMaxSize()

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > defaultMaxSize * 1024 * 1024) {
      return `File size exceeds ${defaultMaxSize}MB limit`
    }

    // Check file type
    const acceptedTypes = (accept || getDefaultAccept()).split(',').map(type => type.trim())
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    const mimeType = file.type

    const isValidType = acceptedTypes.some(type => {
      if (type.startsWith('.')) {
        return fileExtension === type
      }
      if (type.includes('/*')) {
        return mimeType.startsWith(type.split('/')[0])
      }
      return mimeType === type
    })

    if (!isValidType) {
      return `Invalid file type. Accepted types: ${acceptedTypes.join(', ')}`
    }

    return null
  }

  const handleFileUpload = async (file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      onError?.(validationError)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', fileType)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        onUpload(data.file)
      } else {
        const errorData = await response.json()
        onError?.(errorData.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      onError?.('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset input value so same file can be selected again
    event.target.value = ''
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragOver(false)
    
    const files = event.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  if (children) {
    return (
      <>
        <div
          onClick={openFileDialog}
          className={`cursor-pointer ${disabled ? 'pointer-events-none opacity-50' : ''} ${className}`}
        >
          {children}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept || getDefaultAccept()}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          className="hidden"
        />
      </>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept || getDefaultAccept()}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        className="hidden"
      />
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
          }
          ${disabled || uploading ? 'pointer-events-none opacity-50' : ''}
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center">
            <LoadingSpinner size="lg" className="mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
              Drop your file here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getFileTypeDescription(fileType)}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Max size: {defaultMaxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

const getFileTypeDescription = (fileType: string): string => {
  switch (fileType) {
    case 'resume':
      return 'PDF, DOC, or DOCX files'
    case 'portfolio':
      return 'JPEG, PNG, WebP, or GIF images'
    case 'avatar':
      return 'JPEG, PNG, or WebP images'
    default:
      return 'Supported file types only'
  }
}