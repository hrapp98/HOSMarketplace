import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { paymentId } = await req.json()

    if (!paymentId) {
      return NextResponse.json(
        { error: "Missing paymentId" },
        { status: 400 }
      )
    }

    // Find the payment record
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        application: {
          include: {
            job: true,
            applicant: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    // Verify user authorization
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized to access this payment" },
        { status: 403 }
      )
    }

    // Check Stripe payment status
    if (payment.stripePaymentId) {
      const stripePayment = await stripe.paymentIntents.retrieve(payment.stripePaymentId)
      
      if (stripePayment.status === 'succeeded') {
        // Update payment status
        const updatedPayment = await prisma.payment.update({
          where: { id: paymentId },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            processedAt: new Date(),
          }
        })

        // Create notifications
        if (payment.application) {
          await prisma.notification.create({
            data: {
              userId: payment.recipientId!,
              type: 'PAYMENT',
              title: 'Payment Received',
              message: `You received a payment of $${payment.amount} for ${payment.application.job.title}`,
              data: {
                paymentId: payment.id,
                amount: payment.amount.toString(),
                jobTitle: payment.application.job.title,
              }
            }
          })
        }

        return NextResponse.json({
          success: true,
          payment: updatedPayment,
          status: stripePayment.status,
        })
      } else {
        return NextResponse.json({
          success: false,
          status: stripePayment.status,
          message: "Payment not completed yet",
        })
      }
    }

    return NextResponse.json(
      { error: "No Stripe payment ID found" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error confirming payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}