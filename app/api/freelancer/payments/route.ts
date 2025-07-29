import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { prisma } from "@/app/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'FREELANCER') {
      return NextResponse.json(
        { error: "Unauthorized. Only freelancers can access payment history." },
        { status: 401 }
      )
    }

    // Fetch payments for the freelancer
    const payments = await prisma.payment.findMany({
      where: {
        recipientId: session.user.id
      },
      include: {
        application: {
          include: {
            job: {
              include: {
                employer: {
                  include: {
                    profile: true,
                    employerProfile: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate stats
    const totalEarnings = payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount.toNumber() - p.platformFee.toNumber(), 0)

    const pendingPayments = payments.filter(p => p.status === 'PENDING').length
    const completedPayments = payments.filter(p => p.status === 'COMPLETED').length

    // This month earnings
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEarnings = payments
      .filter(p => p.status === 'COMPLETED' && p.paidAt && p.paidAt >= startOfMonth)
      .reduce((sum, p) => sum + p.amount.toNumber() - p.platformFee.toNumber(), 0)

    const stats = {
      totalEarnings,
      pendingPayments,
      completedPayments,
      thisMonthEarnings
    }

    // Transform payments for response
    const transformedPayments = payments.map(payment => ({
      id: payment.id,
      amount: payment.amount.toNumber(),
      platformFee: payment.platformFee.toNumber(),
      currency: payment.currency,
      status: payment.status,
      description: payment.description,
      paidAt: payment.paidAt,
      createdAt: payment.createdAt,
      application: {
        job: {
          title: payment.application?.job.title,
          employer: {
            profile: payment.application?.job.employer.profile,
            employerProfile: payment.application?.job.employer.employerProfile
          }
        }
      }
    }))

    return NextResponse.json({
      payments: transformedPayments,
      stats
    })
  } catch (error) {
    console.error("Error fetching freelancer payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}