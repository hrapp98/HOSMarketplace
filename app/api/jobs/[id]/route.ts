import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const job = await prisma.job.findUnique({
      where: {
        id: id,
        status: 'ACTIVE'
      },
      include: {
        employer: {
          include: {
            profile: true,
            employerProfile: true
          }
        },
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
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      )
    }

    // Increment view count
    await prisma.job.update({
      where: { id: id },
      data: { viewCount: { increment: 1 } }
    })

    // Transform the response
    const transformedJob = {
      ...job,
      applicationCount: job._count.applications,
      viewCount: job.viewCount + 1
    }

    return NextResponse.json(transformedJob)
  } catch (error) {
    console.error("Error fetching job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}