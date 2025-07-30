import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface JobApplicationEmailProps {
  employerName: string
  freelancerName: string
  jobTitle: string
  applicationId: string
}

export default function JobApplicationEmail({
  employerName,
  freelancerName,
  jobTitle,
  applicationId,
}: JobApplicationEmailProps) {
  const applicationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hireoverseas.com'}/employer/applications/${applicationId}`

  return (
    <Html>
      <Head />
      <Preview>New application received for {jobTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://hireoverseas.com/logo.png"
            width="120"
            height="40"
            alt="HireOverseas"
            style={logo}
          />
          
          <Heading style={h1}>New Application Received</Heading>
          
          <Text style={text}>
            Hi {employerName},
          </Text>

          <Text style={text}>
            Good news! <strong>{freelancerName}</strong> has applied for your job posting:
          </Text>

          <Section style={jobSection}>
            <Heading as="h2" style={h2}>{jobTitle}</Heading>
          </Section>

          <Text style={text}>
            The applicant has submitted their proposal and is eager to work with you. 
            Review their application to see their qualifications, proposed rate, and cover letter.
          </Text>

          <Section style={statsSection}>
            <Text style={statsText}>
              <strong>Quick Actions:</strong>
            </Text>
            <ul style={list}>
              <li style={listItem}>Review the applicant's profile and portfolio</li>
              <li style={listItem}>Read their cover letter and proposal</li>
              <li style={listItem}>Accept or decline the application</li>
              <li style={listItem}>Start a conversation with the applicant</li>
            </ul>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={applicationUrl}>
              View Application
            </Button>
          </Section>

          <Text style={text}>
            Remember, talented freelancers are in high demand. We recommend reviewing 
            applications promptly to secure the best talent for your project.
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 HireOverseas. All rights reserved.
            </Text>
            <Text style={footerText}>
              You received this email because you have an active job posting on HireOverseas.
            </Text>
            <Text style={footerText}>
              <Link href="https://hireoverseas.com/settings/notifications" style={footerLink}>
                Manage email preferences
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
}

const logo = {
  margin: '0 auto',
  marginBottom: '32px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '16px 0',
  padding: '0',
  textAlign: 'center' as const,
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '28px',
  margin: '16px 0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const jobSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '24px 0',
}

const statsSection = {
  padding: '16px 24px',
  margin: '16px 0',
}

const statsText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

const list = {
  paddingLeft: '20px',
}

const listItem = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
}

const buttonContainer = {
  padding: '24px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '8px',
  color: '#fff',
  display: 'inline-block',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '48px',
  padding: '0 24px',
  textAlign: 'center' as const,
  textDecoration: 'none',
}

const footer = {
  borderTop: '1px solid #e5e7eb',
  marginTop: '32px',
  paddingTop: '32px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
}

const footerLink = {
  color: '#6b7280',
  textDecoration: 'underline',
}