import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const freelancer = await prisma.user.findUnique({
      where: {
        id: params.id,
        role: 'FREELANCER',
        isActive: true
      },
      include: {
        profile: true,
        freelancerProfile: {
          include: {
            skills: {
              include: {
                skill: true
              },
              orderBy: { yearsExperience: 'desc' }
            },
            education: {
              orderBy: { endDate: 'desc' }
            },
            experience: {
              orderBy: { endDate: 'desc' }
            },
            portfolio: {
              orderBy: { completedAt: 'desc' }
            },
            certifications: {
              orderBy: { issuedAt: 'desc' }
            },
            languages: true
          }
        },
        reviewsReceived: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              include: {
                profile: true,
                employerProfile: true
              }
            },
            job: {
              select: {
                title: true
              }
            }
          }
        }
      }
    })

    if (!freelancer) {
      return NextResponse.json(
        { error: "Freelancer not found" },
        { status: 404 }
      )
    }

    // Calculate profile completion rate
    const completionRate = calculateProfileCompletion(freelancer)

    // Transform the data
    const transformedFreelancer = {
      ...freelancer,
      freelancerProfile: freelancer.freelancerProfile ? {
        ...freelancer.freelancerProfile,
        completionRate,
        // Sort skills by experience and level
        skills: freelancer.freelancerProfile.skills
          .sort((a, b) => b.yearsExperience - a.yearsExperience)
      } : null
    }

    return NextResponse.json(transformedFreelancer)
  } catch (error) {
    console.error("Error fetching freelancer:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function calculateProfileCompletion(user: any): number {
  let completion = 0
  const maxPoints = 100

  // Basic profile info (30 points)
  if (user.profile?.firstName) completion += 5
  if (user.profile?.lastName) completion += 5
  if (user.profile?.avatar) completion += 5
  if (user.profile?.bio) completion += 10
  if (user.profile?.location) completion += 5

  // Freelancer profile (40 points)
  if (user.freelancerProfile?.title) completion += 10
  if (user.freelancerProfile?.hourlyRate) completion += 10
  if (user.freelancerProfile?.skills?.length > 0) completion += 10
  if (user.freelancerProfile?.resume) completion += 10

  // Experience & Education (30 points)
  if (user.freelancerProfile?.experience?.length > 0) completion += 15
  if (user.freelancerProfile?.education?.length > 0) completion += 10
  if (user.freelancerProfile?.portfolio?.length > 0) completion += 5

  return Math.min(completion, maxPoints)
}