import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { ApplicationStatus } from "@prisma/client"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can update application status." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { status } = body

    // Validate status
    const validStatuses = ['PENDING', 'SHORTLISTED', 'INTERVIEW', 'ACCEPTED', 'REJECTED']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }

    // Check if the application exists and belongs to a job owned by the employer
    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        job: {
          employerId: session.user.id
        }
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            employerId: true
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
            }
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found or you don't have permission to update it" },
        { status: 404 }
      )
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: {
        id: params.id
      },
      data: {
        status: status as ApplicationStatus,
        updatedAt: new Date()
      }
    })

    // TODO: Send notification to the applicant about status change
    // TODO: If status is ACCEPTED, potentially update other applications to REJECTED
    // TODO: Send email notification

    return NextResponse.json({
      message: "Application status updated successfully",
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updatedAt
      }
    })
  } catch (error) {
    console.error("Error updating application status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}