import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { stripe } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized. Only employers can upgrade subscriptions." },
        { status: 401 }
      )
    }

    const { planId } = await req.json()

    if (!planId) {
      return NextResponse.json(
        { error: "Plan ID is required" },
        { status: 400 }
      )
    }

    // Plan pricing mapping
    const planPricing = {
      'basic': { price: 29, tier: 'BASIC' },
      'professional': { price: 99, tier: 'PROFESSIONAL' },
      'enterprise': { price: 299, tier: 'ENTERPRISE' }
    }

    const selectedPlan = planPricing[planId as keyof typeof planPricing]

    if (!selectedPlan) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      )
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `HireOverseas ${selectedPlan.tier} Plan`,
              description: `Monthly subscription to HireOverseas ${selectedPlan.tier} plan`,
            },
            unit_amount: selectedPlan.price * 100, // Convert to cents
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?subscription=success&tier=${selectedPlan.tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: {
        userId: session.user.id,
        planId,
        tier: selectedPlan.tier,
      },
      customer_email: session.user.email || undefined,
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: selectedPlan.price,
        currency: 'USD',
        type: 'subscription',
        status: 'PENDING',
        stripePaymentId: checkoutSession.id,
        description: `${selectedPlan.tier} Plan Subscription`,
        metadata: {
          planId,
          tier: selectedPlan.tier,
          checkoutSessionId: checkoutSession.id,
        },
      },
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id,
    })

  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}