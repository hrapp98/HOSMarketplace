import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const minRate = searchParams.get('minRate')
    const maxRate = searchParams.get('maxRate')
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || []
    const availability = searchParams.get('availability') || ''
    const minExperience = searchParams.get('minExperience')
    const maxExperience = searchParams.get('maxExperience')
    const sortBy = searchParams.get('sortBy') || 'lastActive'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      role: 'FREELANCER',
      isActive: true,
      freelancerProfile: {
        isAvailable: true
      }
    }

    if (search) {
      where.OR = [
        {
          profile: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } }
            ]
          }
        },
        {
          freelancerProfile: {
            title: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    if (location) {
      where.profile = {
        ...where.profile,
        OR: [
          { location: { contains: location, mode: 'insensitive' } },
          { country: { contains: location, mode: 'insensitive' } }
        ]
      }
    }

    if (minRate || maxRate) {
      where.freelancerProfile = {
        ...where.freelancerProfile,
        AND: []
      }
      if (minRate) {
        where.freelancerProfile.AND.push({ hourlyRate: { gte: parseFloat(minRate) } })
      }
      if (maxRate) {
        where.freelancerProfile.AND.push({ hourlyRate: { lte: parseFloat(maxRate) } })
      }
    }

    if (availability) {
      where.freelancerProfile = {
        ...where.freelancerProfile,
        availability: availability
      }
    }

    if (minExperience || maxExperience) {
      where.freelancerProfile = {
        ...where.freelancerProfile,
        AND: [...(where.freelancerProfile?.AND || [])]
      }
      if (minExperience) {
        where.freelancerProfile.AND.push({ experienceYears: { gte: parseInt(minExperience) } })
      }
      if (maxExperience) {
        where.freelancerProfile.AND.push({ experienceYears: { lte: parseInt(maxExperience) } })
      }
    }

    if (skills.length > 0) {
      where.freelancerProfile = {
        ...where.freelancerProfile,
        skills: {
          some: {
            skill: {
              name: {
                in: skills
              }
            }
          }
        }
      }
    }

    // Build orderBy clause
    let orderBy: any = {}
    switch (sortBy) {
      case 'rating':
        orderBy = { freelancerProfile: { avgRating: sortOrder } }
        break
      case 'rate':
        orderBy = { freelancerProfile: { hourlyRate: sortOrder } }
        break
      case 'experience':
        orderBy = { freelancerProfile: { experienceYears: sortOrder } }
        break
      case 'earnings':
        orderBy = { freelancerProfile: { totalEarned: sortOrder } }
        break
      case 'lastActive':
      default:
        orderBy = { lastActive: sortOrder }
        break
    }

    const [freelancers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          profile: true,
          freelancerProfile: {
            include: {
              skills: {
                include: {
                  skill: true
                },
                take: 10 // Limit skills for performance
              },
              education: {
                orderBy: { endDate: 'desc' },
                take: 3
              },
              experience: {
                orderBy: { endDate: 'desc' },
                take: 3
              }
            }
          },
          reviewsReceived: {
            take: 3,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                include: {
                  profile: true,
                  employerProfile: true
                }
              }
            }
          }
        },
        orderBy,
        skip: offset,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Transform the data to include computed fields
    const transformedFreelancers = freelancers.map(freelancer => ({
      ...freelancer,
      freelancerProfile: freelancer.freelancerProfile ? {
        ...freelancer.freelancerProfile,
        completionRate: calculateProfileCompletion(freelancer),
        topSkills: freelancer.freelancerProfile.skills
          .sort((a, b) => b.yearsExperience - a.yearsExperience)
          .slice(0, 5)
      } : null
    }))

    return NextResponse.json({
      freelancers: transformedFreelancers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching freelancers:", error)
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