import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can access this endpoint." },
        { status: 401 }
      )
    }

    // Fetch all applications by the current freelancer
    const applications = await prisma.application.findMany({
      where: {
        applicantId: session.user.id
      },
      include: {
        job: {
          include: {
            employer: {
              include: {
                profile: true,
                employerProfile: true
              }
            }
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    return NextResponse.json({
      applications
    })
  } catch (error) {
    console.error("Error fetching freelancer applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}