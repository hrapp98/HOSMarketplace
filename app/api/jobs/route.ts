import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"
import { JobStatus } from "@prisma/client"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'EMPLOYER') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      requirements,
      responsibilities,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      currency,
      location,
      isRemote,
      status = 'ACTIVE',
      skills
    } = body

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { error: "Title and description are required" },
        { status: 400 }
      )
    }

    // Create the job
    const job = await prisma.job.create({
      data: {
        title,
        description,
        requirements: requirements || [],
        responsibilities: responsibilities || [],
        employmentType,
        experienceLevel,
        salaryMin: salaryMin ? parseFloat(salaryMin) : null,
        salaryMax: salaryMax ? parseFloat(salaryMax) : null,
        currency,
        location: isRemote ? null : location,
        isRemote,
        status: status as JobStatus,
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        expiresAt: status === 'ACTIVE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null, // 30 days from now
        employerId: session.user.id,
        skills: {
          create: skills?.map((skillName: string) => ({
            skill: {
              connectOrCreate: {
                where: { name: skillName },
                create: {
                  name: skillName,
                  category: 'General' // You might want to categorize skills later
                }
              }
            },
            isRequired: true
          })) || []
        }
      },
      include: {
        skills: {
          include: {
            skill: true
          }
        },
        employer: {
          include: {
            profile: true,
            employerProfile: true
          }
        }
      }
    })

    // Update user's subscription job post count if the job is active
    if (status === 'ACTIVE') {
      await prisma.subscription.update({
        where: { userId: session.user.id },
        data: {
          jobPostsUsed: {
            increment: 1
          }
        }
      })
    }

    return NextResponse.json(job, { status: 201 })
  } catch (error) {
    console.error("Error creating job:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const employmentType = searchParams.get('employmentType') || ''
    const experienceLevel = searchParams.get('experienceLevel') || ''
    const minSalary = searchParams.get('minSalary')
    const maxSalary = searchParams.get('maxSalary')
    const skills = searchParams.get('skills')?.split(',').filter(Boolean) || []
    const isRemote = searchParams.get('isRemote')

    const offset = (page - 1) * limit

    // Build where clause
    const where: any = {
      status: 'ACTIVE',
      publishedAt: {
        lte: new Date()
      },
      OR: [
        { expiresAt: null },
        { expiresAt: { gte: new Date() } }
      ]
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (employmentType) {
      where.employmentType = employmentType
    }

    if (experienceLevel) {
      where.experienceLevel = experienceLevel
    }

    if (minSalary || maxSalary) {
      where.AND = where.AND || []
      if (minSalary) {
        where.AND.push({ salaryMin: { gte: parseFloat(minSalary) } })
      }
      if (maxSalary) {
        where.AND.push({ salaryMax: { lte: parseFloat(maxSalary) } })
      }
    }

    if (isRemote === 'true') {
      where.isRemote = true
    } else if (isRemote === 'false') {
      where.isRemote = false
    }

    if (skills.length > 0) {
      where.skills = {
        some: {
          skill: {
            name: {
              in: skills
            }
          }
        }
      }
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          employer: {
            include: {
              profile: true,
              employerProfile: true
            }
          },
          skills: {
            include: {
              skill: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: {
          publishedAt: 'desc'
        },
        skip: offset,
        take: limit
      }),
      prisma.job.count({ where })
    ])

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}