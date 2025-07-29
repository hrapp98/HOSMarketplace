import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { stripe, calculatePlatformFee } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can create payments." },
        { status: 401 }
      )
    }

    const { applicationId, amount, currency = 'USD', description } = await req.json()

    if (!applicationId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: applicationId and amount" },
        { status: 400 }
      )
    }

    // Verify the application exists and employer owns the job
    const application = await prisma.application.findFirst({
      where: {
        id: applicationId,
        job: {
          employerId: session.user.id
        }
      },
      include: {
        job: true,
        applicant: {
          include: {
            freelancerProfile: true
          }
        }
      }
    })

    if (!application) {
      return NextResponse.json(
        { error: "Application not found or unauthorized" },
        { status: 404 }
      )
    }

    // Check if freelancer has Stripe account set up
    if (!application.applicant.freelancerProfile?.stripeAccountId) {
      return NextResponse.json(
        { error: "Freelancer has not set up payment account yet" },
        { status: 400 }
      )
    }

    const platformFee = calculatePlatformFee(amount)
    const netAmount = amount - platformFee

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: Math.round(platformFee * 100),
      transfer_data: {
        destination: application.applicant.freelancerProfile.stripeAccountId,
      },
      metadata: {
        applicationId,
        employerId: session.user.id,
        freelancerId: application.applicantId,
        description: description || `Payment for ${application.job.title}`,
      },
    })

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        recipientId: application.applicantId,
        applicationId,
        amount,
        platformFee,
        currency,
        type: "job_payment",
        status: "PENDING",
        stripePaymentId: paymentIntent.id,
        description: description || `Payment for ${application.job.title}`,
        metadata: {
          jobTitle: application.job.title,
          clientSecret: paymentIntent.client_secret,
        },
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentId: payment.id,
      amount,
      platformFee,
      netAmount,
    })

  } catch (error) {
    console.error("Error creating payment intent:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}