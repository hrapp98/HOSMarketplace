import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { createConnectedAccount, createAccountLink } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can create Stripe accounts." },
        { status: 401 }
      )
    }

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        freelancerProfile: true
      }
    })

    if (!user || !user.profile || !user.freelancerProfile) {
      return NextResponse.json(
        { error: "Complete your profile before setting up payments" },
        { status: 400 }
      )
    }

    // Check if Stripe account already exists
    if (user.freelancerProfile.stripeAccountId) {
      // Create new onboarding link for existing account
      const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/freelancer/onboarding`
      const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/freelancer/onboarding?success=true`
      
      const accountLink = await createAccountLink(
        user.freelancerProfile.stripeAccountId,
        refreshUrl,
        returnUrl
      )

      return NextResponse.json({
        onboardingUrl: accountLink.url
      })
    }

    // Create new Stripe connected account
    const account = await createConnectedAccount(
      user.email,
      user.profile.country || 'US',
      {
        userId: user.id,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        role: 'freelancer'
      }
    )

    // Save Stripe account ID to database
    await prisma.freelancerProfile.update({
      where: { userId: user.id },
      data: {
        stripeAccountId: account.id,
        stripeAccountStatus: 'PENDING'
      }
    })

    // Create onboarding link
    const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/freelancer/onboarding`
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/freelancer/onboarding?success=true`
    
    const accountLink = await createAccountLink(
      account.id,
      refreshUrl,
      returnUrl
    )

    return NextResponse.json({
      accountId: account.id,
      onboardingUrl: accountLink.url
    })
  } catch (error) {
    console.error("Error creating Stripe account:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}