import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can withdraw applications." },
        { status: 401 }
      )
    }

    // Check if the application exists and belongs to the current freelancer
    const application = await prisma.application.findFirst({
      where: {
        id: params.id,
        applicantId: session.user.id
      },
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found or you don't have permission to withdraw it" },
        { status: 404 }
      )
    }

    // Check if application can be withdrawn (only pending applications)
    if (application.status !== 'PENDING') {
      return NextResponse.json(
        { error: "You can only withdraw pending applications" },
        { status: 400 }
      )
    }

    // Update the application status to withdrawn
    const updatedApplication = await prisma.application.update({
      where: {
        id: params.id
      },
      data: {
        status: 'WITHDRAWN',
        updatedAt: new Date()
      }
    })

    // Decrease job application count
    await prisma.job.update({
      where: { id: application.job.id },
      data: { applicationCount: { decrement: 1 } }
    })

    // TODO: Send notification to employer about withdrawal
    // TODO: Send confirmation email to freelancer

    return NextResponse.json({
      message: "Application withdrawn successfully",
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        updatedAt: updatedApplication.updatedAt
      }
    })
  } catch (error) {
    console.error("Error withdrawing application:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}