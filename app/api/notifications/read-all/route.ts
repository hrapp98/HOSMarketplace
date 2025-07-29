import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Mark all notifications as read for the current user
    await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        isRead: false
      },
      data: {
        isRead: true
      }
    })

    return NextResponse.json({
      message: "All notifications marked as read"
    })
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}