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
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const applicationId = params.id

    // Fetch application with related data
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
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
        },
        applicant: {
          include: {
            profile: true,
            freelancerProfile: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Check authorization - either the employer or the applicant can access
    const isEmployer = session.user.id === application.job.employerId
    const isApplicant = session.user.id === application.applicantId

    if (!isEmployer && !isApplicant) {
      return NextResponse.json(
        { error: "Unauthorized to access this application" },
        { status: 403 }
      )
    }

    return NextResponse.json(application)

  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

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

    const applicationId = params.id
    const { status } = await req.json()

    // Verify application exists and user has permission
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    // Only employer can update application status
    if (session.user.id !== application.job.employerId) {
      return NextResponse.json(
        { error: "Only the job employer can update application status" },
        { status: 403 }
      )
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
      include: {
        job: true,
        applicant: {
          include: {
            profile: true
          }
        }
      }
    })

    // Create notification for applicant
    await prisma.notification.create({
      data: {
        userId: application.applicantId,
        type: 'APPLICATION_STATUS',
        title: 'Application Status Updated',
        message: `Your application for "${application.job.title}" has been ${status.toLowerCase()}`,
        data: {
          applicationId: application.id,
          jobId: application.jobId,
          status,
          jobTitle: application.job.title
        }
      }
    })

    return NextResponse.json(updatedApplication)

  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}