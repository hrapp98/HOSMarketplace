import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const recipientId = searchParams.get('recipientId')
    const authorId = searchParams.get('authorId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const skip = (page - 1) * limit

    const where: any = {}
    if (recipientId) where.recipientId = recipientId
    if (authorId) where.authorId = authorId

    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          author: {
            include: {
              profile: true,
              employerProfile: true,
              freelancerProfile: true
            }
          },
          recipient: {
            include: {
              profile: true,
              employerProfile: true,
              freelancerProfile: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limit
      }),
      prisma.review.count({ where })
    ])

    // Calculate average rating for recipient
    let avgRating = null
    if (recipientId) {
      const ratingStats = await prisma.review.aggregate({
        where: { recipientId },
        _avg: { rating: true },
        _count: { rating: true }
      })
      avgRating = {
        average: ratingStats._avg.rating || 0,
        count: ratingStats._count.rating || 0
      }
    }

    const transformedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      author: {
        id: review.author.id,
        name: review.author.profile?.firstName && review.author.profile?.lastName 
          ? `${review.author.profile.firstName} ${review.author.profile.lastName}`
          : review.author.email?.split('@')[0] || 'Anonymous',
        role: review.author.role,
        avatar: review.author.profile?.avatar,
        companyName: review.author.employerProfile?.companyName,
        title: review.author.freelancerProfile?.title
      },
      recipient: {
        id: review.recipient.id,
        name: review.recipient.profile?.firstName && review.recipient.profile?.lastName 
          ? `${review.recipient.profile.firstName} ${review.recipient.profile.lastName}`
          : review.recipient.email?.split('@')[0] || 'Anonymous',
        role: review.recipient.role,
        avatar: review.recipient.profile?.avatar,
        companyName: review.recipient.employerProfile?.companyName,
        title: review.recipient.freelancerProfile?.title
      }
    }))

    return NextResponse.json({
      reviews: transformedReviews,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      avgRating
    })

  } catch (error) {
    console.error("Error fetching reviews:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { recipientId, jobId, rating, title, comment } = await req.json()

    // Validation
    if (!recipientId || !rating || !title || !comment) {
      return NextResponse.json(
        { error: "Missing required fields: recipientId, rating, title, comment" },
        { status: 400 }
      )
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    if (recipientId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot review yourself" },
        { status: 400 }
      )
    }

    // Check if user has already reviewed this person for this job
    if (jobId) {
      const existingReview = await prisma.review.findFirst({
        where: {
          authorId: session.user.id,
          recipientId,
          jobId
        }
      })

      if (existingReview) {
        return NextResponse.json(
          { error: "You have already reviewed this person for this job" },
          { status: 409 }
        )
      }
    }

    // Verify that the reviewer has had a business relationship with the recipient
    let hasRelationship = false
    
    if (session.user.role === 'EMPLOYER') {
      // Employer reviewing freelancer - check if freelancer worked on employer's job
      const relationship = await prisma.application.findFirst({
        where: {
          applicantId: recipientId,
          job: {
            employerId: session.user.id
          },
          status: 'ACCEPTED'
        }
      })
      hasRelationship = !!relationship
    } else if (session.user.role === 'FREELANCER') {
      // Freelancer reviewing employer - check if freelancer applied to employer's job
      const relationship = await prisma.application.findFirst({
        where: {
          applicantId: session.user.id,
          job: {
            employerId: recipientId
          },
          status: 'ACCEPTED'
        }
      })
      hasRelationship = !!relationship
    }

    if (!hasRelationship) {
      return NextResponse.json(
        { error: "You can only review users you have worked with" },
        { status: 403 }
      )
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        authorId: session.user.id,
        recipientId,
        jobId,
        rating,
        title,
        comment,
        isVerified: hasRelationship
      },
      include: {
        author: {
          include: {
            profile: true,
            employerProfile: true,
            freelancerProfile: true
          }
        },
        recipient: {
          include: {
            profile: true,
            employerProfile: true,
            freelancerProfile: true
          }
        }
      }
    })

    // Update recipient's average rating
    const ratingStats = await prisma.review.aggregate({
      where: { recipientId },
      _avg: { rating: true }
    })

    const avgRating = ratingStats._avg.rating || 0

    // Update user profile with new average rating
    if (review.recipient.role === 'FREELANCER') {
      await prisma.freelancerProfile.update({
        where: { userId: recipientId },
        data: { avgRating }
      })
    } else if (review.recipient.role === 'EMPLOYER') {
      await prisma.employerProfile.update({
        where: { userId: recipientId },
        data: { avgRating }
      })
    }

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'SYSTEM',
        title: 'New Review Received',
        message: `You received a ${rating}-star review from ${review.author.profile?.firstName || 'a user'}`,
        data: {
          reviewId: review.id,
          rating,
          authorName: review.author.profile?.firstName && review.author.profile?.lastName 
            ? `${review.author.profile.firstName} ${review.author.profile.lastName}`
            : 'Anonymous'
        }
      }
    })

    const transformedReview = {
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      isVerified: review.isVerified,
      createdAt: review.createdAt,
      author: {
        id: review.author.id,
        name: review.author.profile?.firstName && review.author.profile?.lastName 
          ? `${review.author.profile.firstName} ${review.author.profile.lastName}`
          : review.author.email?.split('@')[0] || 'Anonymous',
        role: review.author.role,
        avatar: review.author.profile?.avatar,
        companyName: review.author.employerProfile?.companyName,
        title: review.author.freelancerProfile?.title
      }
    }

    return NextResponse.json(transformedReview, { status: 201 })

  } catch (error) {
    console.error("Error creating review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}