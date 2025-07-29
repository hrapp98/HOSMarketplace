import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { calculatePlatformFee, calculateFreelancerAmount } from "@/lib/stripe"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can access payment details." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const applicationId = searchParams.get('application')

    if (!applicationId) {
      return NextResponse.json(
        { error: "Application ID is required" },
        { status: 400 }
      )
    }

    // Fetch application with related data
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          employerId: session.user.id
        },
        status: 'ACCEPTED' // Only accepted applications can be paid
      },
      include: {
        applicant: {
          include: {
            profile: true,
            freelancerProfile: true
          }
        },
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
        { error: "Application not found or not eligible for payment" },
        { status: 404 }
      )
    }

    // Check if payment already exists for this application
    const existingPayment = await prisma.payment.findFirst({
      where: {
        applicationId: applicationId,
        status: {
          in: ['PROCESSING', 'COMPLETED']
        }
      }
    })

    if (existingPayment) {
      return NextResponse.json(
        { error: "Payment has already been processed for this application" },
        { status: 400 }
      )
    }

    // Calculate payment amounts
    const proposedRate = application.proposedRate?.toNumber() || application.applicant.freelancerProfile?.hourlyRate.toNumber() || 0
    const amount = proposedRate // This could be multiplied by hours in a real scenario
    const platformFee = calculatePlatformFee(amount)
    const freelancerAmount = calculateFreelancerAmount(amount)

    const paymentDetails = {
      applicationId: application.id,
      freelancer: {
        id: application.applicant.id,
        profile: application.applicant.profile,
        freelancerProfile: application.applicant.freelancerProfile
      },
      job: application.job,
      amount,
      currency: 'usd',
      description: `Payment for ${application.job.title}`,
      platformFee,
      freelancerAmount
    }

    return NextResponse.json(paymentDetails)
  } catch (error) {
    console.error("Error fetching payment details:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}