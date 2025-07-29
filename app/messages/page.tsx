"use client"

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Message {
  id: string
  content: string
  sentAt: string
  senderId: string
  sender: {
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  readAt?: string
}

interface Conversation {
  id: string
  participants: Array<{
    id: string
    profile: {
      firstName: string
      lastName: string
      avatar?: string
    }
    role: string
    employerProfile?: {
      companyName: string
    }
    freelancerProfile?: {
      title: string
    }
  }>
  messages: Message[]
  lastMessage?: Message
  unreadCount: number
  updatedAt: string
  application?: {
    id: string
    job: {
      title: string
    }
  }
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (session) {
      fetchConversations()
    }
  }, [session])

  useEffect(() => {
    scrollToBottom()
  }, [selectedConversation?.messages])

  useEffect(() => {
    if (selectedConversation) {
      markAsRead(selectedConversation.id)
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/messages/conversations')
      if (response.ok) {
        const data = await response.json()
        setConversations(data.conversations)
        if (data.conversations.length > 0 && !selectedConversation) {
          setSelectedConversation(data.conversations[0])
        }
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (conversationId: string) => {
    try {
      await fetch(`/api/messages/conversations/${conversationId}/read`, {
        method: 'PATCH'
      })
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return

    setSending(true)
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim()
        })
      })

      if (response.ok) {
        const message = await response.json()
        
        // Update selected conversation with new message
        setSelectedConversation(prev => prev ? {
          ...prev,
          messages: [...prev.messages, message]
        } : null)
        
        // Update conversations list
        setConversations(prev => prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, lastMessage: message, updatedAt: message.sentAt }
            : conv
        ))
        
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.id !== session?.user.id)
  }

  const getParticipantDisplayName = (participant: any) => {
    if (participant.role === 'EMPLOYER' && participant.employerProfile) {
      return participant.employerProfile.companyName
    }
    return `${participant.profile.firstName} ${participant.profile.lastName}`
  }

  const getParticipantSubtitle = (participant: any) => {
    if (participant.role === 'EMPLOYER') {
      return 'Employer'
    }
    if (participant.freelancerProfile) {
      return participant.freelancerProfile.title
    }
    return 'Freelancer'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container-max section-padding py-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Communicate with clients and freelancers
          </p>
        </div>
      </div>

      <div className="container-max section-padding py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No conversations yet
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {conversations.map((conversation) => {
                      const otherParticipant = getOtherParticipant(conversation)
                      if (!otherParticipant) return null

                      return (
                        <div
                          key={conversation.id}
                          className={cn(
                            "p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors",
                            selectedConversation?.id === conversation.id && "bg-primary-50 dark:bg-primary-900/20 border-r-2 border-primary-500"
                          )}
                          onClick={() => setSelectedConversation(conversation)}
                        >
                          <div className="flex items-start space-x-3">
                            <Avatar
                              src={otherParticipant.profile.avatar}
                              name={getParticipantDisplayName(otherParticipant)}
                              size="md"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {getParticipantDisplayName(otherParticipant)}
                                </p>
                                {conversation.unreadCount > 0 && (
                                  <Badge variant="primary" size="sm">
                                    {conversation.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {getParticipantSubtitle(otherParticipant)}
                              </p>
                              {conversation.lastMessage && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                              {conversation.application && (
                                <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                                  Re: {conversation.application.job.title}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-1">
                                {formatRelativeTime(conversation.updatedAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3">
            <Card className="h-full flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                      {(() => {
                        const otherParticipant = getOtherParticipant(selectedConversation)
                        if (!otherParticipant) return null

                        return (
                          <>
                            <Avatar
                              src={otherParticipant.profile.avatar}
                              name={getParticipantDisplayName(otherParticipant)}
                              size="lg"
                            />
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {getParticipantDisplayName(otherParticipant)}
                              </h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {getParticipantSubtitle(otherParticipant)}
                              </p>
                              {selectedConversation.application && (
                                <p className="text-sm text-primary-600 dark:text-primary-400">
                                  Job Application: {selectedConversation.application.job.title}
                                </p>
                              )}
                            </div>
                          </>
                        )
                      })()}
                    </div>
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-4 overflow-y-auto">
                    <div className="space-y-4">
                      {selectedConversation.messages.map((message) => {
                        const isOwnMessage = message.senderId === session?.user.id
                        
                        return (
                          <div
                            key={message.id}
                            className={cn(
                              "flex",
                              isOwnMessage ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                                isOwnMessage
                                  ? "bg-primary-500 text-white"
                                  : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                              )}
                            >
                              <p className="text-sm">{message.content}</p>
                              <p
                                className={cn(
                                  "text-xs mt-1",
                                  isOwnMessage
                                    ? "text-primary-100"
                                    : "text-gray-500 dark:text-gray-400"
                                )}
                              >
                                {formatRelativeTime(message.sentAt)}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendMessage()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                      >
                        {sending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Select a conversation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose a conversation from the sidebar to start messaging
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}