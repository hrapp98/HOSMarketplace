import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can access this endpoint." },
        { status: 401 }
      )
    }

    // Fetch all jobs by the current employer
    const jobs = await prisma.job.findMany({
      where: {
        employerId: session.user.id
      },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data
    const transformedJobs = jobs.map(job => ({
      ...job,
      applicationCount: job._count.applications
    }))

    return NextResponse.json({
      jobs: transformedJobs,
      pagination: {
        page: 1,
        limit: 100,
        total: jobs.length,
        pages: 1
      }
    })
  } catch (error) {
    console.error("Error fetching employer jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}