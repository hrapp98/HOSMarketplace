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

interface ApplicationStatusEmailProps {
  freelancerName: string
  jobTitle: string
  status: 'ACCEPTED' | 'REJECTED'
  message?: string
}

export default function ApplicationStatusEmail({
  freelancerName,
  jobTitle,
  status,
  message,
}: ApplicationStatusEmailProps) {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hireoverseas.com'}/dashboard`
  const isAccepted = status === 'ACCEPTED'

  return (
    <Html>
      <Head />
      <Preview>
        {isAccepted 
          ? `Congratulations! Your application for ${jobTitle} was accepted`
          : `Update on your application for ${jobTitle}`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://hireoverseas.com/logo.png"
            width="120"
            height="40"
            alt="HireOverseas"
            style={logo}
          />
          
          <Heading style={h1}>
            {isAccepted ? '🎉 Congratulations!' : 'Application Update'}
          </Heading>
          
          <Text style={text}>
            Hi {freelancerName},
          </Text>

          <Text style={text}>
            {isAccepted ? (
              <>
                Great news! Your application for <strong>{jobTitle}</strong> has been accepted. 
                The employer is interested in working with you!
              </>
            ) : (
              <>
                Thank you for your interest in <strong>{jobTitle}</strong>. 
                After careful consideration, the employer has decided to move forward with other candidates.
              </>
            )}
          </Text>

          {message && (
            <Section style={messageSection}>
              <Heading as="h3" style={h3}>Message from the employer:</Heading>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}

          {isAccepted ? (
            <>
              <Section style={section}>
                <Heading as="h2" style={h2}>Next Steps</Heading>
                <ul style={list}>
                  <li style={listItem}>The employer may reach out to discuss project details</li>
                  <li style={listItem}>Agree on milestones and payment terms</li>
                  <li style={listItem}>Start working on the project</li>
                  <li style={listItem}>Keep communication professional and timely</li>
                </ul>
              </Section>

              <Section style={buttonContainer}>
                <Button style={button} href={dashboardUrl}>
                  View Project Details
                </Button>
              </Section>
            </>
          ) : (
            <>
              <Text style={text}>
                Don't be discouraged! This doesn't reflect on your skills or qualifications. 
                Keep applying to other opportunities that match your expertise.
              </Text>

              <Section style={section}>
                <Heading as="h2" style={h2}>Tips for Future Applications</Heading>
                <ul style={list}>
                  <li style={listItem}>Tailor your proposals to each specific job</li>
                  <li style={listItem}>Highlight relevant experience and skills</li>
                  <li style={listItem}>Include portfolio samples when applicable</li>
                  <li style={listItem}>Be clear about your availability and rates</li>
                </ul>
              </Section>

              <Section style={buttonContainer}>
                <Button style={button} href={`${dashboardUrl}/jobs`}>
                  Find More Opportunities
                </Button>
              </Section>
            </>
          )}

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 HireOverseas. All rights reserved.
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

const h3 = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '12px 0',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const section = {
  padding: '24px',
}

const messageSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '24px 0',
}

const messageText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '8px 0',
  fontStyle: 'italic',
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