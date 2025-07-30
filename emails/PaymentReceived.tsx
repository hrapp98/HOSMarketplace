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

interface PaymentReceivedEmailProps {
  freelancerName: string
  amount: number
  jobTitle: string
  paymentId: string
}

export default function PaymentReceivedEmail({
  freelancerName,
  amount,
  jobTitle,
  paymentId,
}: PaymentReceivedEmailProps) {
  const paymentsUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hireoverseas.com'}/freelancer/payments`
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  return (
    <Html>
      <Head />
      <Preview>Payment received: {formattedAmount} for {jobTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://hireoverseas.com/logo.png"
            width="120"
            height="40"
            alt="HireOverseas"
            style={logo}
          />
          
          <Heading style={h1}>💰 Payment Received!</Heading>
          
          <Text style={text}>
            Hi {freelancerName},
          </Text>

          <Text style={text}>
            Great news! You've received a payment for your work on <strong>{jobTitle}</strong>.
          </Text>

          <Section style={paymentSection}>
            <Text style={amountText}>{formattedAmount}</Text>
            <Text style={paymentIdText}>Payment ID: {paymentId}</Text>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={h2}>Payment Details</Heading>
            <table style={table}>
              <tbody>
                <tr>
                  <td style={tableLabel}>Project:</td>
                  <td style={tableValue}>{jobTitle}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Gross Amount:</td>
                  <td style={tableValue}>{formattedAmount}</td>
                </tr>
                <tr>
                  <td style={tableLabel}>Platform Fee (10%):</td>
                  <td style={tableValue}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(amount * 0.1)}
                  </td>
                </tr>
                <tr>
                  <td style={tableLabelBold}>Net Amount:</td>
                  <td style={tableValueBold}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(amount * 0.9)}
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Text style={text}>
            The funds will be available in your connected Stripe account. 
            Processing times may vary depending on your bank.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={paymentsUrl}>
              View Payment History
            </Button>
          </Section>

          <Section style={tipSection}>
            <Text style={tipText}>
              <strong>💡 Tip:</strong> Don't forget to thank your client and ask for a review! 
              Positive reviews help you attract more clients.
            </Text>
          </Section>

          <Section style={footer}>
            <Text style={footerText}>
              © 2024 HireOverseas. All rights reserved.
            </Text>
            <Text style={footerText}>
              Questions about this payment?{' '}
              <Link href="mailto:payments@hireoverseas.com" style={footerLink}>
                Contact our support team
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

const paymentSection = {
  backgroundColor: '#10b981',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const amountText = {
  color: '#ffffff',
  fontSize: '36px',
  fontWeight: '700',
  lineHeight: '48px',
  margin: '0',
}

const paymentIdText = {
  color: '#ffffff',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0 0 0',
  opacity: 0.9,
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const tableLabel = {
  color: '#6b7280',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '8px 0',
  textAlign: 'left' as const,
}

const tableValue = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  padding: '8px 0',
  textAlign: 'right' as const,
}

const tableLabelBold = {
  ...tableLabel,
  fontWeight: '600',
  borderTop: '2px solid #e5e7eb',
  paddingTop: '16px',
}

const tableValueBold = {
  ...tableValue,
  fontWeight: '600',
  borderTop: '2px solid #e5e7eb',
  paddingTop: '16px',
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
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px 24px',
  margin: '24px',
}

const tipText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
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