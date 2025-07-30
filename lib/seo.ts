import { Metadata } from 'next'

// Base SEO configuration
export const BASE_SEO = {
  siteName: 'HireOverseas',
  siteUrl: 'https://hireoverseas.com',
  defaultTitle: 'HireOverseas - Find Top Remote Talent Worldwide',
  defaultDescription: 'Connect with exceptional overseas talent for full-time remote positions. Build your dream team with pre-vetted professionals at competitive rates.',
  defaultKeywords: [
    'remote work',
    'overseas talent',
    'hiring',
    'freelancers',
    'remote jobs',
    'global talent',
    'remote employment',
    'international hiring',
    'work from home',
    'distributed teams'
  ],
  author: 'HireOverseas',
  twitterHandle: '@hireoverseas',
  linkedinHandle: 'hireoverseas',
  facebookHandle: 'hireoverseas',
}

// Generate metadata for pages
export function generateMetadata(options: {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  author?: string
  publishedTime?: string
  modifiedTime?: string
  noIndex?: boolean
  canonical?: string
}): Metadata {
  const {
    title,
    description = BASE_SEO.defaultDescription,
    keywords = [],
    image = `${BASE_SEO.siteUrl}/og-image.jpg`,
    url = BASE_SEO.siteUrl,
    type = 'website',
    author = BASE_SEO.author,
    publishedTime,
    modifiedTime,
    noIndex = false,
    canonical,
  } = options

  const fullTitle = title 
    ? `${title} | ${BASE_SEO.siteName}`
    : BASE_SEO.defaultTitle

  const allKeywords = [...BASE_SEO.defaultKeywords, ...keywords]

  return {
    title: fullTitle,
    description,
    keywords: allKeywords.join(', '),
    authors: [{ name: author }],
    creator: author,
    publisher: BASE_SEO.siteName,
    
    // Robots
    robots: noIndex 
      ? 'noindex, nofollow' 
      : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

    // Canonical URL
    alternates: canonical ? { canonical } : undefined,

    // Open Graph
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: BASE_SEO.siteName,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title || BASE_SEO.defaultTitle,
        },
      ],
      locale: 'en_US',
      type,
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },

    // Twitter
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [image],
      creator: BASE_SEO.twitterHandle,
      site: BASE_SEO.twitterHandle,
    },

    // Additional meta tags
    other: {
      'application-name': BASE_SEO.siteName,
      'apple-mobile-web-app-title': BASE_SEO.siteName,
      'theme-color': '#3b82f6',
      'msapplication-TileColor': '#3b82f6',
    },
  }
}

// SEO utilities for different page types
export const seoUtils = {
  // Home page SEO
  homePage: () => generateMetadata({
    title: 'Find Top Remote Talent Worldwide',
    description: 'Connect with exceptional overseas talent for full-time remote positions. Build your dream team with pre-vetted professionals at competitive rates.',
    keywords: ['remote hiring platform', 'global talent marketplace', 'overseas developers'],
  }),

  // Job listing page SEO
  jobPage: (job: {
    title: string
    description: string
    company: string
    location?: string
    skills: string[]
  }) => generateMetadata({
    title: `${job.title} at ${job.company}`,
    description: job.description.substring(0, 160),
    keywords: [job.title, job.company, ...(job.skills || []), 'remote job'],
    type: 'article',
  }),

  // Freelancer profile SEO
  freelancerPage: (freelancer: {
    name: string
    title: string
    bio: string
    skills: string[]
    location: string
  }) => generateMetadata({
    title: `${freelancer.name} - ${freelancer.title}`,
    description: freelancer.bio.substring(0, 160),
    keywords: [freelancer.name, freelancer.title, ...freelancer.skills, freelancer.location],
    type: 'profile',
  }),

  // Company profile SEO
  companyPage: (company: {
    name: string
    description: string
    industry: string
    location: string
  }) => generateMetadata({
    title: `${company.name} - ${company.industry} Company`,
    description: company.description.substring(0, 160),
    keywords: [company.name, company.industry, company.location, 'remote employer'],
    type: 'profile',
  }),

  // Job search results SEO
  jobSearchPage: (filters: {
    query?: string
    location?: string
    skills?: string[]
  }) => {
    let title = 'Remote Jobs'
    let description = 'Find remote job opportunities from top companies worldwide.'

    if (filters.query) {
      title = `${filters.query} Remote Jobs`
      description = `Find ${filters.query} remote job opportunities.`
    }

    if (filters.location) {
      title += ` in ${filters.location}`
      description += ` Work remotely from ${filters.location}.`
    }

    return generateMetadata({
      title,
      description,
      keywords: [
        ...(filters.query ? [filters.query] : []),
        ...(filters.location ? [filters.location] : []),
        ...(filters.skills || []),
        'remote jobs',
        'job search'
      ],
    })
  },

  // Talent search results SEO
  talentSearchPage: (filters: {
    skills?: string[]
    location?: string
    experience?: string
  }) => {
    let title = 'Find Remote Talent'
    let description = 'Discover skilled remote professionals for your projects.'

    if (filters.skills && filters.skills.length > 0) {
      title = `Find ${filters.skills.join(', ')} Talent`
      description = `Hire skilled ${filters.skills.join(', ')} professionals for remote work.`
    }

    if (filters.location) {
      title += ` from ${filters.location}`
      description += ` Based in ${filters.location}.`
    }

    return generateMetadata({
      title,
      description,
      keywords: [
        ...(filters.skills || []),
        ...(filters.location ? [filters.location] : []),
        'remote talent',
        'hire developers',
        'talent search'
      ],
    })
  },

  // Blog post SEO
  blogPost: (post: {
    title: string
    description: string
    author: string
    publishedAt: Date
    updatedAt?: Date
    tags: string[]
    slug: string
  }) => generateMetadata({
    title: post.title,
    description: post.description,
    keywords: post.tags,
    author: post.author,
    publishedTime: post.publishedAt.toISOString(),
    modifiedTime: post.updatedAt?.toISOString(),
    url: `${BASE_SEO.siteUrl}/blog/${post.slug}`,
    type: 'article',
  }),

  // Category page SEO
  categoryPage: (category: {
    name: string
    description: string
    jobCount: number
  }) => generateMetadata({
    title: `${category.name} Remote Jobs`,
    description: `${category.description} Browse ${category.jobCount} ${category.name} remote job opportunities.`,
    keywords: [category.name, 'remote jobs', 'job category'],
  }),
}

// Structured data (JSON-LD) generators
export const structuredData = {
  // Organization schema
  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: BASE_SEO.siteName,
    url: BASE_SEO.siteUrl,
    logo: `${BASE_SEO.siteUrl}/logo.png`,
    sameAs: [
      `https://twitter.com/${BASE_SEO.twitterHandle.replace('@', '')}`,
      `https://linkedin.com/company/${BASE_SEO.linkedinHandle}`,
      `https://facebook.com/${BASE_SEO.facebookHandle}`,
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      url: `${BASE_SEO.siteUrl}/contact`,
    },
  }),

  // Job posting schema
  jobPosting: (job: {
    title: string
    description: string
    company: string
    location?: string
    salary?: { min: number; max: number; currency: string }
    employmentType: string
    datePosted: Date
    validThrough?: Date
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
    },
    jobLocation: job.location ? {
      '@type': 'Place',
      address: job.location,
    } : undefined,
    baseSalary: job.salary ? {
      '@type': 'MonetaryAmount',
      currency: job.salary.currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary.min,
        maxValue: job.salary.max,
        unitText: 'YEAR',
      },
    } : undefined,
    employmentType: job.employmentType,
    datePosted: job.datePosted.toISOString(),
    validThrough: job.validThrough?.toISOString(),
  }),

  // Person schema (for freelancer profiles)
  person: (person: {
    name: string
    jobTitle: string
    description: string
    image?: string
    url: string
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    description: person.description,
    image: person.image,
    url: person.url,
  }),

  // Website schema
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: BASE_SEO.siteName,
    url: BASE_SEO.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${BASE_SEO.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }),

  // Breadcrumb schema
  breadcrumb: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
}

// SEO validation utilities
export const seoValidation = {
  // Validate title length
  validateTitle: (title: string): { valid: boolean; issues: string[] } => {
    const issues: string[] = []
    
    if (title.length < 30) {
      issues.push('Title is too short (should be 30-60 characters)')
    }
    if (title.length > 60) {
      issues.push('Title is too long (should be 30-60 characters)')
    }
    
    return { valid: issues.length === 0, issues }
  },

  // Validate description length
  validateDescription: (description: string): { valid: boolean; issues: string[] } => {
    const issues: string[] = []
    
    if (description.length < 120) {
      issues.push('Description is too short (should be 120-160 characters)')
    }
    if (description.length > 160) {
      issues.push('Description is too long (should be 120-160 characters)')
    }
    
    return { valid: issues.length === 0, issues }
  },

  // Validate keywords
  validateKeywords: (keywords: string[]): { valid: boolean; issues: string[] } => {
    const issues: string[] = []
    
    if (keywords.length === 0) {
      issues.push('No keywords provided')
    }
    if (keywords.length > 10) {
      issues.push('Too many keywords (should be 5-10)')
    }
    
    return { valid: issues.length === 0, issues }
  },
}