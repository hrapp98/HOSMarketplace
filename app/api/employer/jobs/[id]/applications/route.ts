import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can access this endpoint." },
        { status: 401 }
      )
    }

    // First check if the job belongs to the current employer
    const job = await prisma.job.findUnique({
      where: {
        id: id,
        employerId: session.user.id
      },
      select: {
        id: true,
        title: true,
        status: true,
        publishedAt: true,
        applicationCount: true
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or you don't have permission to access it" },
        { status: 404 }
      )
    }

    // Fetch applications with detailed applicant information
    const applications = await prisma.application.findMany({
      where: {
        jobId: id
      },
      include: {
        applicant: {
          include: {
            profile: true,
            freelancerProfile: {
              include: {
                skills: {
                  include: {
                    skill: true
                  },
                  orderBy: { yearsExperience: 'desc' },
                  take: 5
                }
              }
            },
            reviewsReceived: {
              select: {
                rating: true
              }
            }
          }
        }
      },
      orderBy: {
        appliedAt: 'desc'
      }
    })

    // Transform the applications data
    const transformedApplications = applications.map(application => ({
      ...application,
      applicant: {
        ...application.applicant,
        freelancerProfile: application.applicant.freelancerProfile ? {
          ...application.applicant.freelancerProfile,
          topSkills: application.applicant.freelancerProfile.skills.map(skill => ({
            skill: skill.skill,
            yearsExperience: skill.yearsExperience,
            level: skill.level
          }))
        } : null
      }
    }))

    const jobWithApplications = {
      ...job,
      applications: transformedApplications
    }

    return NextResponse.json(jobWithApplications)
  } catch (error) {
    console.error("Error fetching job applications:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}