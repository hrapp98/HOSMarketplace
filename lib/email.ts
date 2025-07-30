import nodemailer from 'nodemailer'
import { render } from '@react-email/render'

// Email templates
import WelcomeEmail from '@/emails/Welcome'
import JobApplicationEmail from '@/emails/JobApplication'
import ApplicationStatusEmail from '@/emails/ApplicationStatus'
import PaymentReceivedEmail from '@/emails/PaymentReceived'
import NewMessageEmail from '@/emails/NewMessage'

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Email sending function
export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text?: string
}) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'HireOverseas'}" <${process.env.EMAIL_FROM || 'noreply@hireoverseas.com'}>`,
      to,
      subject,
      text,
      html,
    })

    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Email template functions
export async function sendWelcomeEmail(user: {
  email: string
  name: string
  role: string
}) {
  const html = render(WelcomeEmail({ name: user.name, role: user.role }))
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to HireOverseas!',
    html,
  })
}

export async function sendJobApplicationEmail({
  employerEmail,
  employerName,
  freelancerName,
  jobTitle,
  applicationId,
}: {
  employerEmail: string
  employerName: string
  freelancerName: string
  jobTitle: string
  applicationId: string
}) {
  const html = render(
    JobApplicationEmail({
      employerName,
      freelancerName,
      jobTitle,
      applicationId,
    })
  )

  return sendEmail({
    to: employerEmail,
    subject: `New Application for ${jobTitle}`,
    html,
  })
}

export async function sendApplicationStatusEmail({
  freelancerEmail,
  freelancerName,
  jobTitle,
  status,
  message,
}: {
  freelancerEmail: string
  freelancerName: string
  jobTitle: string
  status: 'ACCEPTED' | 'REJECTED'
  message?: string
}) {
  const html = render(
    ApplicationStatusEmail({
      freelancerName,
      jobTitle,
      status,
      message,
    })
  )

  const subject = status === 'ACCEPTED' 
    ? `Good news! Your application for ${jobTitle} was accepted`
    : `Update on your application for ${jobTitle}`

  return sendEmail({
    to: freelancerEmail,
    subject,
    html,
  })
}

export async function sendPaymentReceivedEmail({
  freelancerEmail,
  freelancerName,
  amount,
  jobTitle,
  paymentId,
}: {
  freelancerEmail: string
  freelancerName: string
  amount: number
  jobTitle: string
  paymentId: string
}) {
  const html = render(
    PaymentReceivedEmail({
      freelancerName,
      amount,
      jobTitle,
      paymentId,
    })
  )

  return sendEmail({
    to: freelancerEmail,
    subject: `Payment Received for ${jobTitle}`,
    html,
  })
}

export async function sendNewMessageEmail({
  recipientEmail,
  recipientName,
  senderName,
  message,
  conversationId,
}: {
  recipientEmail: string
  recipientName: string
  senderName: string
  message: string
  conversationId: string
}) {
  const html = render(
    NewMessageEmail({
      recipientName,
      senderName,
      message,
      conversationId,
    })
  )

  return sendEmail({
    to: recipientEmail,
    subject: `New message from ${senderName}`,
    html,
  })
}