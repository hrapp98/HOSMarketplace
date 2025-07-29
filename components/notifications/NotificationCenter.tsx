"use client"

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
  data?: Record<string, any>
  sender?: {
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
    employerProfile?: {
      companyName: string
    }
  }
}

export default function NotificationCenter() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session) {
      fetchNotifications()
      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications)
        
        const unread = data.notifications.filter((n: Notification) => !n.isRead).length
        setUnreadCount(unread)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  const markAsRead = async (notificationId?: string) => {
    try {
      const url = notificationId 
        ? `/api/notifications/${notificationId}/read`
        : `/api/notifications/read-all`
      
      const response = await fetch(url, {
        method: 'PATCH'
      })

      if (response.ok) {
        if (notificationId) {
          setNotifications(prev => prev.map(n => 
            n.id === notificationId ? { ...n, isRead: true } : n
          ))
          setUnreadCount(prev => Math.max(0, prev - 1))
        } else {
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
          setUnreadCount(0)
        }
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id)
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'MESSAGE':
        if (notification.data?.conversationId) {
          window.location.href = `/messages?conversation=${notification.data.conversationId}`
        }
        break
      case 'JOB_APPLICATION':
        if (notification.data?.jobId) {
          window.location.href = `/employer/jobs/${notification.data.jobId}/applications`
        }
        break
      case 'APPLICATION_UPDATE':
        if (notification.data?.applicationId) {
          window.location.href = `/freelancer/applications`
        }
        break
      default:
        break
    }
    
    setIsOpen(false)
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return (
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        )
      case 'JOB_APPLICATION':
        return (
          <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )
      case 'APPLICATION_UPDATE':
        return (
          <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.09L5.25 14h5.25V3.09z" />
            </svg>
          </div>
        )
    }
  }

  if (!session) return null

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.09L5.25 14h5.25V3.09z" />
        </svg>
        
        {unreadCount > 0 && (
          <Badge 
            variant="primary" 
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => markAsRead()}
                >
                  Mark all read
                </Button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.09L5.25 14h5.25V3.09z" />
                  </svg>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No notifications yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                      !notification.isRead && "bg-blue-50 dark:bg-blue-900/20"
                    )}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                              {formatRelativeTime(notification.createdAt)}
                            </p>
                          </div>
                          
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                          )}
                        </div>
                        
                        {notification.sender && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Avatar
                              src={notification.sender.profile.avatar}
                              name={`${notification.sender.profile.firstName} ${notification.sender.profile.lastName}`}
                              size="xs"
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {notification.sender.employerProfile?.companyName || 
                               `${notification.sender.profile.firstName} ${notification.sender.profile.lastName}`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 dark:border-gray-700">
              <Button size="sm" variant="ghost" className="w-full">
                View All Notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}