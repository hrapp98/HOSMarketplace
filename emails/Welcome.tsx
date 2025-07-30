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

interface WelcomeEmailProps {
  name: string
  role: string
}

export default function WelcomeEmail({ name, role }: WelcomeEmailProps) {
  const isFreelancer = role === 'FREELANCER'
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hireoverseas.com'}/dashboard`

  return (
    <Html>
      <Head />
      <Preview>Welcome to HireOverseas - Your global talent marketplace</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://hireoverseas.com/logo.png"
            width="120"
            height="40"
            alt="HireOverseas"
            style={logo}
          />
          
          <Heading style={h1}>Welcome to HireOverseas, {name}!</Heading>
          
          <Text style={text}>
            We're thrilled to have you join our global talent marketplace.
            {isFreelancer
              ? " You're now part of a community where your skills can reach employers worldwide."
              : " You now have access to talented professionals from around the globe."}
          </Text>

          <Section style={section}>
            <Heading as="h2" style={h2}>
              Getting Started
            </Heading>
            
            {isFreelancer ? (
              <>
                <Text style={text}>Here's what you can do next:</Text>
                <ul style={list}>
                  <li style={listItem}>Complete your profile to stand out</li>
                  <li style={listItem}>Browse available jobs that match your skills</li>
                  <li style={listItem}>Set up your payment details</li>
                  <li style={listItem}>Start applying to jobs that interest you</li>
                </ul>
              </>
            ) : (
              <>
                <Text style={text}>Here's what you can do next:</Text>
                <ul style={list}>
                  <li style={listItem}>Post your first job listing</li>
                  <li style={listItem}>Browse talented freelancers</li>
                  <li style={listItem}>Set up your company profile</li>
                  <li style={listItem}>Explore subscription plans for more features</li>
                </ul>
              </>
            )}
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={dashboardUrl}>
              Go to Dashboard
            </Button>
          </Section>

          <Text style={text}>
            If you have any questions, our support team is here to help at{' '}
            <Link href="mailto:support@hireoverseas.com" style={link}>
              support@hireoverseas.com
            </Link>
          </Text>

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 HireOverseas. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://hireoverseas.com/privacy" style={footerLink}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href="https://hireoverseas.com/terms" style={footerLink}>
                Terms of Service
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

const section = {
  padding: '24px',
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

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
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