import { NextResponse } from "next/server"

export async function GET() {
  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      tier: 'FREE',
      price: 0,
      currency: 'USD',
      interval: 'month',
      features: [
        '3 job posts per month',
        'Basic applicant filtering',
        'Email support',
        'Standard job visibility'
      ],
      limits: {
        jobPosts: 3,
        featuredPosts: 0,
        applicantFilters: 'basic',
        support: 'email'
      },
      popular: false
    },
    {
      id: 'basic',
      name: 'Basic Plan',
      tier: 'BASIC',
      price: 29,
      currency: 'USD',
      interval: 'month',
      features: [
        '10 job posts per month',
        '2 featured job posts',
        'Advanced applicant filtering',
        'Priority email support',
        'Enhanced job visibility'
      ],
      limits: {
        jobPosts: 10,
        featuredPosts: 2,
        applicantFilters: 'advanced',
        support: 'priority'
      },
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional Plan',
      tier: 'PROFESSIONAL',
      price: 99,
      currency: 'USD',
      interval: 'month',
      features: [
        '50 job posts per month',
        '10 featured job posts',
        'Advanced applicant filtering',
        'Dedicated account manager',
        'Premium job visibility',
        'Bulk messaging',
        'Analytics dashboard'
      ],
      limits: {
        jobPosts: 50,
        featuredPosts: 10,
        applicantFilters: 'advanced',
        support: 'dedicated'
      },
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      tier: 'ENTERPRISE',
      price: 299,
      currency: 'USD',
      interval: 'month',
      features: [
        'Unlimited job posts',
        'Unlimited featured posts',
        'AI-powered candidate matching',
        '24/7 phone support',
        'Custom branding',
        'API access',
        'Advanced analytics',
        'Team collaboration tools'
      ],
      limits: {
        jobPosts: -1, // unlimited
        featuredPosts: -1, // unlimited
        applicantFilters: 'ai-powered',
        support: '24/7'
      },
      popular: false
    }
  ]

  return NextResponse.json({ plans })
}