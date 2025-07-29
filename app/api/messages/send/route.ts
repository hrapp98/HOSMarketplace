import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

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
    const { conversationId, content } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: "Message content is too long (max 1000 characters)" },
        { status: 400 }
      )
    }

    // Verify user is participant in this conversation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
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
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found or you don't have permission" },
        { status: 404 }
      )
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        conversationId,
        senderId: session.user.id,
        content: content.trim()
      },
      include: {
        sender: {
          include: {
            profile: true
          }
        }
      }
    })

    // Update conversation's last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    })

    // TODO: Send real-time notification to other participants
    // TODO: Send email notification if recipient is offline

    return NextResponse.json({
      id: message.id,
      content: message.content,
      sentAt: message.sentAt,
      senderId: message.senderId,
      sender: message.sender,
      readAt: message.readAt
    }, { status: 201 })
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}