import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { getAccountDetails } from "@/lib/stripe"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can access this endpoint." },
        { status: 401 }
      )
    }

    // Get freelancer profile
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!freelancerProfile) {
      return NextResponse.json(
        { error: "Freelancer profile not found" },
        { status: 404 }
      )
    }

    const hasStripeAccount = !!freelancerProfile.stripeAccountId
    let accountDetails = null

    if (hasStripeAccount && freelancerProfile.stripeAccountId) {
      try {
        accountDetails = await getAccountDetails(freelancerProfile.stripeAccountId)
      } catch (error) {
        console.error('Error fetching Stripe account details:', error)
      }
    }

    const status = {
      hasStripeAccount,
      stripeAccountId: freelancerProfile.stripeAccountId,
      accountStatus: freelancerProfile.stripeAccountStatus || 'NONE',
      detailsSubmitted: accountDetails?.details_submitted || false,
      chargesEnabled: accountDetails?.charges_enabled || false,
      payoutsEnabled: accountDetails?.payouts_enabled || false
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error("Error fetching Stripe status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}