import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify the notification belongs to the current user
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      )
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: params.id },
      data: { isRead: true }
    })

    return NextResponse.json({
      message: "Notification marked as read"
    })
  } catch (error) {
    console.error("Error marking notification as read:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}