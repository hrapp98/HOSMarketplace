import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { sendJobApplicationEmail } from "@/lib/email"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
        id: id,
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
        jobId: id,
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
        jobId: id,
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
                email: true,
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
      where: { id: id },
      data: { applicationCount: { increment: 1 } }
    })

    // Send email notification to employer
    try {
      await sendJobApplicationEmail({
        employerEmail: application.job.employer.email,
        employerName: application.job.employer.profile?.firstName || application.job.employer.employerProfile?.companyName || 'Employer',
        freelancerName: application.applicant.profile?.firstName || 'Freelancer',
        jobTitle: application.job.title,
        applicationId: application.id,
      })
    } catch (emailError) {
      console.error("Failed to send application email:", emailError)
      // Don't fail the application if email fails
    }

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