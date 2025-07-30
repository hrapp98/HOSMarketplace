import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { createPaymentIntent, calculatePlatformFee } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can create payment intents." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { applicationId, amount, currency = 'usd' } = body

    if (!applicationId || !amount) {
      return NextResponse.json(
        { error: "Application ID and amount are required" },
        { status: 400 }
      )
    }

    // Verify the application belongs to the employer
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          employerId: session.user.id
        },
        status: 'ACCEPTED'
      },
      include: {
        applicant: {
          include: {
            profile: true
          }
        },
        job: {
          select: {
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

    // Check if payment already exists
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
        { error: "Payment already exists for this application" },
        { status: 400 }
      )
    }

    // Create Stripe payment intent
    const platformFee = calculatePlatformFee(amount)
    const paymentIntent = await createPaymentIntent(
      amount,
      currency,
      {
        applicationId,
        jobTitle: application.job.title,
        freelancerName: `${application.applicant.profile?.firstName} ${application.applicant.profile?.lastName}`,
        platformFee: platformFee.toString()
      }
    )

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        applicationId,
        userId: session.user.id,
        recipientId: application.applicantId,
        amount: amount,
        platformFee: platformFee,
        currency: currency.toUpperCase(),
        type: 'job_payment',
        status: 'PENDING',
        stripePaymentId: paymentIntent.id,
        description: `Payment for ${application.job.title}`
      }
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}