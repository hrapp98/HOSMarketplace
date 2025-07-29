import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { retrievePaymentIntent } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { paymentIntentId, applicationId } = body

    if (!paymentIntentId || !applicationId) {
      return NextResponse.json(
        { error: "Payment intent ID and application ID are required" },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe to verify status
    const paymentIntent = await retrievePaymentIntent(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: "Payment not successful" },
        { status: 400 }
      )
    }

    // Update payment status in database
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentIntentId: paymentIntentId,
        applicationId: applicationId
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      )
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        transactionId: paymentIntent.id
      }
    })

    // Create notification for freelancer
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            title: true
          }
        }
      }
    })

    if (application) {
      await prisma.notification.create({
        data: {
          userId: application.applicantId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received',
          message: `You've received payment for ${application.job.title}`,
          data: {
            paymentId: payment.id,
            applicationId: applicationId,
            amount: payment.amount.toString()
          },
          isRead: false
        }
      })
    }

    return NextResponse.json({
      message: "Payment confirmed successfully",
      paymentId: payment.id
    })
  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}