import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ hasApplied: false })
    }

    // Check if user has applied to this job
    const application = await prisma.application.findFirst({
      where: {
        jobId: params.id,
        applicantId: session.user.id
      },
      select: {
        id: true,
        status: true,
        appliedAt: true
      }
    })

    return NextResponse.json({
      hasApplied: !!application,
      application: application || null
    })
  } catch (error) {
    console.error("Error checking application status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}