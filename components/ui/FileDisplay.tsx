"use client"

import React, { useState } from 'react'
import { Button } from './Button'
import { Badge } from './Badge'
import { formatDate } from '@/lib/utils'

interface FileDisplayProps {
  file: {
    url: string
    public_id?: string
    original_name?: string
    size?: number
    format?: string
    type?: string
    createdAt?: string
  }
  showPreview?: boolean
  showDelete?: boolean
  onDelete?: () => void
  className?: string
}

export const FileDisplay: React.FC<FileDisplayProps> = ({
  file,
  showPreview = true,
  showDelete = false,
  onDelete,
  className = ""
}) => {
  const [imageError, setImageError] = useState(false)

  const formatFileSize = (bytes: number = 0): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (format: string = '', type: string = ''): JSX.Element => {
    if (type === 'resume' || ['pdf', 'doc', 'docx'].includes(format.toLowerCase())) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
    
    if (type === 'portfolio' || type === 'avatar' || ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase())) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }

    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }

  const isImage = (format: string = '', type: string = ''): boolean => {
    return type === 'portfolio' || type === 'avatar' || 
           ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(format.toLowerCase())
  }

  const handleDownload = () => {
    window.open(file.url, '_blank')
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-4">
        {/* File Preview/Icon */}
        <div className="flex-shrink-0">
          {showPreview && isImage(file.format, file.type) && !imageError ? (
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
              <img
                src={file.url}
                alt={file.original_name || 'File preview'}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              {getFileIcon(file.format, file.type)}
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {file.original_name || 'Unnamed file'}
              </h4>
              <div className="flex items-center space-x-2 mt-1">
                {file.format && (
                  <Badge size="sm" variant="secondary">
                    {file.format.toUpperCase()}
                  </Badge>
                )}
                {file.size && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
              {file.createdAt && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Uploaded {formatDate(file.createdAt)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 ml-4">
              <Button
                size="sm"
                variant="outline"
                onClick={handleDownload}
                className="h-8 px-3"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                View
              </Button>
              
              {showDelete && onDelete && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  className="h-8 px-3 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}