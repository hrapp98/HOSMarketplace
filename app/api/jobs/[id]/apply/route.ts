import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can apply to jobs." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { coverLetter, proposedRate, availability } = body

    // Validate required fields
    if (!coverLetter || coverLetter.trim().length === 0) {
      return NextResponse.json(
        { error: "Cover letter is required" },
        { status: 400 }
      )
    }

    if (coverLetter.length > 2000) {
      return NextResponse.json(
        { error: "Cover letter must be less than 2000 characters" },
        { status: 400 }
      )
    }

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: {
        id: params.id,
        status: 'ACTIVE'
      }
    })

    if (!job) {
      return NextResponse.json(
        { error: "Job not found or no longer accepting applications" },
        { status: 404 }
      )
    }

    // Check if user has already applied
    const existingApplication = await prisma.application.findFirst({
      where: {
        jobId: params.id,
        applicantId: session.user.id
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { error: "You have already applied to this job" },
        { status: 400 }
      )
    }

    // Check if freelancer is trying to apply to their own job (shouldn't happen, but safety check)
    if (job.employerId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot apply to your own job posting" },
        { status: 400 }
      )
    }

    // Create the application
    const application = await prisma.application.create({
      data: {
        jobId: params.id,
        applicantId: session.user.id,
        coverLetter: coverLetter.trim(),
        proposedRate: proposedRate ? parseFloat(proposedRate) : null,
        availability: availability || 'Full-time',
        status: 'PENDING'
      },
      include: {
        job: {
          select: {
            title: true,
            employer: {
              select: {
                id: true,
                profile: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                },
                employerProfile: {
                  select: {
                    companyName: true
                  }
                }
              }
            }
          }
        },
        applicant: {
          select: {
            id: true,
            profile: {
              select: {
                firstName: true,
                lastName: true
              }
            },
            freelancerProfile: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    // Update job application count
    await prisma.job.update({
      where: { id: params.id },
      data: { applicationCount: { increment: 1 } }
    })

    // TODO: Send notification to employer
    // TODO: Send confirmation email to applicant

    return NextResponse.json(
      {
        message: "Application submitted successfully",
        application: {
          id: application.id,
          status: application.status,
          appliedAt: application.appliedAt
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}