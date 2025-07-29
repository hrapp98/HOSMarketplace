import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { prisma } from "@/app/lib/prisma"
import { constructEvent } from "@/lib/stripe"
import Stripe from "stripe"

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const headersList = headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: "Missing Stripe signature" },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = constructEvent(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSucceeded(paymentIntent)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailed(failedPayment)
        break

      case 'account.updated':
        const account = event.data.object as Stripe.Account
        await handleAccountUpdated(account)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment by Stripe payment intent ID
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: paymentIntent.id
      },
      include: {
        application: {
          include: {
            job: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    if (!payment) {
      console.error('Payment not found for payment intent:', paymentIntent.id)
      return
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
    if (payment.application) {
      await prisma.notification.create({
        data: {
          userId: payment.recipientId!,
          type: 'PAYMENT',
          title: 'Payment Received',
          message: `You've received payment for ${payment.application.job.title}`,
          data: {
            paymentId: payment.id,
            applicationId: payment.applicationId,
            amount: payment.amount.toString()
          }
        }
      })
    }

    console.log('Payment succeeded:', payment.id)
  } catch (error) {
    console.error('Error handling payment succeeded:', error)
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Find payment by Stripe payment intent ID
    const payment = await prisma.payment.findFirst({
      where: {
        stripePaymentId: paymentIntent.id
      }
    })

    if (!payment) {
      console.error('Payment not found for payment intent:', paymentIntent.id)
      return
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'FAILED'
      }
    })

    // Create notification for employer
    await prisma.notification.create({
      data: {
        userId: payment.userId,
        type: 'PAYMENT',
        title: 'Payment Failed',
        message: `Your payment failed. Please try again.`,
        data: {
          paymentId: payment.id,
          applicationId: payment.applicationId,
          amount: payment.amount.toString()
        }
      }
    })

    console.log('Payment failed:', payment.id)
  } catch (error) {
    console.error('Error handling payment failed:', error)
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    // Find user by Stripe account ID
    const user = await prisma.user.findFirst({
      where: {
        freelancerProfile: {
          stripeAccountId: account.id
        }
      }
    })

    if (!user) {
      console.error('User not found for Stripe account:', account.id)
      return
    }

    // Update account status based on Stripe account details
    const isVerified = account.details_submitted && 
                      account.charges_enabled && 
                      account.payouts_enabled

    await prisma.freelancerProfile.update({
      where: { userId: user.id },
      data: {
        stripeAccountStatus: isVerified ? 'VERIFIED' : 'PENDING'
      }
    })

    console.log('Account updated:', account.id, 'verified:', isVerified)
  } catch (error) {
    console.error('Error handling account updated:', error)
  }
}