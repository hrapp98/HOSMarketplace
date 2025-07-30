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

interface NewMessageEmailProps {
  recipientName: string
  senderName: string
  message: string
  conversationId: string
}

export default function NewMessageEmail({
  recipientName,
  senderName,
  message,
  conversationId,
}: NewMessageEmailProps) {
  const messagesUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hireoverseas.com'}/messages/${conversationId}`
  
  // Truncate message for preview
  const truncatedMessage = message.length > 200 
    ? message.substring(0, 200) + '...' 
    : message

  return (
    <Html>
      <Head />
      <Preview>{senderName} sent you a message on HireOverseas</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://hireoverseas.com/logo.png"
            width="120"
            height="40"
            alt="HireOverseas"
            style={logo}
          />
          
          <Heading style={h1}>New Message</Heading>
          
          <Text style={text}>
            Hi {recipientName},
          </Text>

          <Text style={text}>
            You have a new message from <strong>{senderName}</strong> on HireOverseas.
          </Text>

          <Section style={messageSection}>
            <div style={messageHeader}>
              <Text style={senderText}>{senderName}</Text>
              <Text style={timeText}>Just now</Text>
            </div>
            <div style={messageContent}>
              <Text style={messageText}>{truncatedMessage}</Text>
            </div>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={messagesUrl}>
              Reply to Message
            </Button>
          </Section>

          <Text style={text}>
            Keep the conversation going! Quick responses help build trust and move projects forward.
          </Text>

          <Section style={tipSection}>
            <Text style={tipTitle}>🔒 Safety Tips:</Text>
            <ul style={tipList}>
              <li style={tipItem}>Keep all communication on HireOverseas platform</li>
              <li style={tipItem}>Never share personal contact information early</li>
              <li style={tipItem}>Be cautious of requests for upfront payments</li>
            </ul>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 HireOverseas. All rights reserved.
            </Text>
            <Text style={footerText}>
              You received this because you have messages enabled in your{' '}
              <Link href="https://hireoverseas.com/settings/notifications" style={footerLink}>
                notification settings
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

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
}

const messageSection = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  margin: '24px 0',
  overflow: 'hidden',
}

const messageHeader = {
  backgroundColor: '#e5e7eb',
  padding: '12px 24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}

const senderText = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0',
}

const timeText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

const messageContent = {
  padding: '16px 24px',
}

const messageText = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
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

const tipSection = {
  backgroundColor: '#eff6ff',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '24px',
}

const tipTitle = {
  color: '#1e40af',
  fontSize: '14px',
  fontWeight: '600',
  lineHeight: '20px',
  margin: '0 0 8px 0',
}

const tipList = {
  margin: '0',
  paddingLeft: '20px',
}

const tipItem = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '4px 0',
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