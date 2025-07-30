import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/app/lib/auth"
import { sendWelcomeEmail, sendJobApplicationEmail, sendApplicationStatusEmail, sendPaymentReceivedEmail, sendNewMessageEmail } from "@/lib/email"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    
    // Only allow authenticated users to test emails (and maybe restrict to admins in production)
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { type, ...data } = body

    let result

    switch (type) {
      case 'welcome':
        result = await sendWelcomeEmail({
          email: data.email || session.user.email,
          name: data.name || session.user.name || 'Test User',
          role: data.role || session.user.role,
        })
        break

      case 'job-application':
        result = await sendJobApplicationEmail({
          employerEmail: data.employerEmail || session.user.email,
          employerName: data.employerName || 'Test Employer',
          freelancerName: data.freelancerName || 'Test Freelancer',
          jobTitle: data.jobTitle || 'Test Job Title',
          applicationId: data.applicationId || 'test-123',
        })
        break

      case 'application-status':
        result = await sendApplicationStatusEmail({
          freelancerEmail: data.freelancerEmail || session.user.email,
          freelancerName: data.freelancerName || 'Test Freelancer',
          jobTitle: data.jobTitle || 'Test Job Title',
          status: data.status || 'ACCEPTED',
          message: data.message || 'Great work! We would love to work with you.',
        })
        break

      case 'payment-received':
        result = await sendPaymentReceivedEmail({
          freelancerEmail: data.freelancerEmail || session.user.email,
          freelancerName: data.freelancerName || 'Test Freelancer',
          amount: data.amount || 500,
          jobTitle: data.jobTitle || 'Test Job Title',
          paymentId: data.paymentId || 'pay_test123',
        })
        break

      case 'new-message':
        result = await sendNewMessageEmail({
          recipientEmail: data.recipientEmail || session.user.email,
          recipientName: data.recipientName || 'Test Recipient',
          senderName: data.senderName || 'Test Sender',
          message: data.message || 'Hello! This is a test message.',
          conversationId: data.conversationId || 'conv_test123',
        })
        break

      default:
        return NextResponse.json(
          { error: "Invalid email type. Supported types: welcome, job-application, application-status, payment-received, new-message" },
          { status: 400 }
        )
    }

    if (result?.success) {
      return NextResponse.json({
        message: "Email sent successfully",
        messageId: result.messageId,
        type
      })
    } else {
      return NextResponse.json(
        { error: "Failed to send email", details: result?.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}