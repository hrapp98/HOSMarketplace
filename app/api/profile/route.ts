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

    // Fetch user profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        freelancerProfile: true,
        employerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      profile: user.profile,
      freelancerProfile: user.freelancerProfile,
      employerProfile: user.employerProfile
    })

  } catch (error) {
    console.error("Error fetching profile:", error)
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

    const { profile, freelancerProfile, employerProfile } = await req.json()

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        profile: true,
        freelancerProfile: true,
        employerProfile: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Update basic profile
    let updatedProfile = user.profile
    if (profile) {
      if (user.profile) {
        updatedProfile = await prisma.profile.update({
          where: { userId: session.user.id },
          data: profile
        })
      } else {
        updatedProfile = await prisma.profile.create({
          data: {
            userId: session.user.id,
            ...profile,
            country: profile.country || 'US' // Default country if not provided
          }
        })
      }
    }

    // Update freelancer profile
    let updatedFreelancerProfile = user.freelancerProfile
    if (freelancerProfile && session.user.role === 'FREELANCER') {
      if (user.freelancerProfile) {
        updatedFreelancerProfile = await prisma.freelancerProfile.update({
          where: { userId: session.user.id },
          data: freelancerProfile
        })
      } else if (freelancerProfile.title && freelancerProfile.hourlyRate) {
        updatedFreelancerProfile = await prisma.freelancerProfile.create({
          data: {
            userId: session.user.id,
            title: freelancerProfile.title,
            hourlyRate: freelancerProfile.hourlyRate,
            ...freelancerProfile
          }
        })
      }
    }

    // Update employer profile
    let updatedEmployerProfile = user.employerProfile
    if (employerProfile && session.user.role === 'EMPLOYER') {
      if (user.employerProfile) {
        updatedEmployerProfile = await prisma.employerProfile.update({
          where: { userId: session.user.id },
          data: employerProfile
        })
      } else if (employerProfile.companyName) {
        updatedEmployerProfile = await prisma.employerProfile.create({
          data: {
            userId: session.user.id,
            companyName: employerProfile.companyName,
            ...employerProfile
          }
        })
      }
    }

    return NextResponse.json({
      profile: updatedProfile,
      freelancerProfile: updatedFreelancerProfile,
      employerProfile: updatedEmployerProfile
    })

  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}