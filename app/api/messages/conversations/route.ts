import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch all conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              include: {
                profile: true,
                employerProfile: true,
                freelancerProfile: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 50,
          include: {
            sender: {
              include: {
                profile: true
              }
            }
          }
        },
        application: {
          include: {
            job: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    // Transform the data
    const transformedConversations = conversations.map(conversation => {
      const messages = conversation.messages.reverse() // Show oldest first
      const lastMessage = conversation.messages[0] // Most recent message
      
      // Count unread messages
      const unreadCount = conversation.messages.filter(message => 
        message.senderId !== session.user.id && !message.readAt
      ).length

      return {
        id: conversation.id,
        participants: conversation.participants.map(p => ({
          id: p.user.id,
          profile: p.user.profile,
          role: p.user.role,
          employerProfile: p.user.employerProfile,
          freelancerProfile: p.user.freelancerProfile
        })),
        messages: messages.map(message => ({
          id: message.id,
          content: message.content,
          sentAt: message.sentAt,
          senderId: message.senderId,
          sender: message.sender,
          readAt: message.readAt
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content,
          sentAt: lastMessage.sentAt,
          senderId: lastMessage.senderId,
          sender: lastMessage.sender,
          readAt: lastMessage.readAt
        } : null,
        unreadCount,
        updatedAt: conversation.updatedAt,
        application: conversation.application
      }
    })

    return NextResponse.json({
      conversations: transformedConversations
    })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { participantId, applicationId } = body

    // Validate participant exists
    const participant = await prisma.user.findUnique({
      where: { id: participantId }
    })

    if (!participant) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 }
      )
    }

    // Check if conversation already exists between these users
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: {
                userId: session.user.id
              }
            }
          },
          {
            participants: {
              some: {
                userId: participantId
              }
            }
          }
        ],
        ...(applicationId && { applicationId })
      }
    })

    if (existingConversation) {
      return NextResponse.json({
        conversation: { id: existingConversation.id }
      })
    }

    // Create new conversation
    const conversation = await prisma.conversation.create({
      data: {
        applicationId: applicationId || null,
        participants: {
          create: [
            { userId: session.user.id },
            { userId: participantId }
          ]
        }
      }
    })

    return NextResponse.json({
      conversation: { id: conversation.id }
    }, { status: 201 })
  } catch (error) {
    console.error("Error creating conversation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}