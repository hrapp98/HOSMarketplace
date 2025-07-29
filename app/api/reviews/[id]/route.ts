import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = params.id

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
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

    if (!review) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    const transformedReview = {
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
    }

    return NextResponse.json(transformedReview)

  } catch (error) {
    console.error("Error fetching review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const reviewId = params.id
    const { rating, title, comment } = await req.json()

    // Check if review exists and user owns it
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    if (existingReview.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "You can only edit your own reviews" },
        { status: 403 }
      )
    }

    // Validation
    if (rating && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5" },
        { status: 400 }
      )
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating }),
        ...(title && { title }),
        ...(comment && { comment })
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
            profile: true
          }
        }
      }
    })

    // Recalculate recipient's average rating if rating was updated
    if (rating) {
      const ratingStats = await prisma.review.aggregate({
        where: { recipientId: existingReview.recipientId },
        _avg: { rating: true }
      })

      const avgRating = ratingStats._avg.rating || 0

      // Update user profile with new average rating
      if (updatedReview.recipient.role === 'FREELANCER') {
        await prisma.freelancerProfile.update({
          where: { userId: existingReview.recipientId },
          data: { avgRating }
        })
      } else if (updatedReview.recipient.role === 'EMPLOYER') {
        await prisma.employerProfile.update({
          where: { userId: existingReview.recipientId },
          data: { avgRating }
        })
      }
    }

    const transformedReview = {
      id: updatedReview.id,
      rating: updatedReview.rating,
      title: updatedReview.title,
      comment: updatedReview.comment,
      isVerified: updatedReview.isVerified,
      createdAt: updatedReview.createdAt,
      updatedAt: updatedReview.updatedAt,
      author: {
        id: updatedReview.author.id,
        name: updatedReview.author.profile?.firstName && updatedReview.author.profile?.lastName 
          ? `${updatedReview.author.profile.firstName} ${updatedReview.author.profile.lastName}`
          : updatedReview.author.email?.split('@')[0] || 'Anonymous',
        role: updatedReview.author.role,
        avatar: updatedReview.author.profile?.avatar,
        companyName: updatedReview.author.employerProfile?.companyName,
        title: updatedReview.author.freelancerProfile?.title
      }
    }

    return NextResponse.json(transformedReview)

  } catch (error) {
    console.error("Error updating review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const reviewId = params.id

    // Check if review exists and user owns it
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    })

    if (!existingReview) {
      return NextResponse.json(
        { error: "Review not found" },
        { status: 404 }
      )
    }

    if (existingReview.authorId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: "You can only delete your own reviews" },
        { status: 403 }
      )
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId }
    })

    // Recalculate recipient's average rating
    const ratingStats = await prisma.review.aggregate({
      where: { recipientId: existingReview.recipientId },
      _avg: { rating: true }
    })

    const avgRating = ratingStats._avg.rating || 0

    // Get recipient info to update correct profile
    const recipient = await prisma.user.findUnique({
      where: { id: existingReview.recipientId }
    })

    if (recipient) {
      // Update user profile with new average rating
      if (recipient.role === 'FREELANCER') {
        await prisma.freelancerProfile.update({
          where: { userId: existingReview.recipientId },
          data: { avgRating }
        })
      } else if (recipient.role === 'EMPLOYER') {
        await prisma.employerProfile.update({
          where: { userId: existingReview.recipientId },
          data: { avgRating }
        })
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error deleting review:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}