import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Fetch user's current subscription
    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
    })

    if (!subscription) {
      // Create default free subscription if none exists
      const newSubscription = await prisma.subscription.create({
        data: {
          userId: session.user.id,
          tier: 'FREE',
          jobPostLimit: 3,
          jobPostsUsed: 0,
          featuredPosts: 0,
          isActive: true,
        }
      })
      
      return NextResponse.json(newSubscription)
    }

    return NextResponse.json(subscription)

  } catch (error) {
    console.error("Error fetching subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { tier } = await req.json()

    if (!['FREE', 'BASIC', 'PROFESSIONAL', 'ENTERPRISE'].includes(tier)) {
      return NextResponse.json(
        { error: "Invalid subscription tier" },
        { status: 400 }
      )
    }

    // Define subscription limits
    const tierLimits = {
      FREE: { jobPostLimit: 3, featuredPosts: 0 },
      BASIC: { jobPostLimit: 10, featuredPosts: 2 },
      PROFESSIONAL: { jobPostLimit: 50, featuredPosts: 10 },
      ENTERPRISE: { jobPostLimit: -1, featuredPosts: -1 } // -1 means unlimited
    }

    const limits = tierLimits[tier as keyof typeof tierLimits]

    // Update subscription
    const updatedSubscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        tier,
        jobPostLimit: limits.jobPostLimit,
        featuredPosts: limits.featuredPosts,
        isActive: true,
        startDate: new Date(),
        endDate: tier === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
      create: {
        userId: session.user.id,
        tier,
        jobPostLimit: limits.jobPostLimit,
        jobPostsUsed: 0,
        featuredPosts: limits.featuredPosts,
        isActive: true,
        startDate: new Date(),
        endDate: tier === 'FREE' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }
    })

    return NextResponse.json(updatedSubscription)

  } catch (error) {
    console.error("Error updating subscription:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}