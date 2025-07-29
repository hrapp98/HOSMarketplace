import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { createDashboardLink } from "@/lib/stripe"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can access Stripe dashboard." },
        { status: 401 }
      )
    }

    // Get freelancer profile
    const freelancerProfile = await prisma.freelancerProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!freelancerProfile || !freelancerProfile.stripeAccountId) {
      return NextResponse.json(
        { error: "Stripe account not found. Please complete onboarding first." },
        { status: 404 }
      )
    }

    // Create dashboard link
    const dashboardLink = await createDashboardLink(freelancerProfile.stripeAccountId)

    return NextResponse.json({
      dashboardUrl: dashboardLink.url
    })
  } catch (error) {
    console.error("Error creating dashboard link:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}