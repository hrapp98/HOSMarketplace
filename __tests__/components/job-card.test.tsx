// Job card component tests
import { render, screen, fireEvent } from '@testing-library/react'
import { JobCard } from '@/components/jobs/job-card'
import { testData, mockFunctions } from '@/lib/test-utils'

// Mock Next.js router
jest.mock('next/navigation')
const mockRouter = mockFunctions.mockRouter

describe('JobCard Component', () => {
  const defaultJob = testData.job()

  beforeEach(() => {
    jest.resetAllMocks()
    mockFunctions.mockRouter.push.mockClear()
  })

  it('should render job information correctly', () => {
    render(<JobCard job={defaultJob} />)

    expect(screen.getByText(defaultJob.title)).toBeInTheDocument()
    expect(screen.getByText(defaultJob.description)).toBeInTheDocument()
    expect(screen.getByText(defaultJob.employer.employerProfile.companyName)).toBeInTheDocument()
    expect(screen.getByText(`$${defaultJob.salaryMin.toLocaleString()}`)).toBeInTheDocument()
    expect(screen.getByText(`$${defaultJob.salaryMax.toLocaleString()}`)).toBeInTheDocument()
  })

  it('should display job status badge', () => {
    render(<JobCard job={defaultJob} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Active')).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should show employment type and experience level', () => {
    render(<JobCard job={defaultJob} />)

    expect(screen.getByText('Full Time')).toBeInTheDocument()
    expect(screen.getByText('Intermediate')).toBeInTheDocument()
  })

  it('should display remote work indicator', () => {
    const remoteJob = testData.job({ isRemote: true })
    render(<JobCard job={remoteJob} />)

    expect(screen.getByText('Remote')).toBeInTheDocument()
  })

  it('should not display remote indicator for non-remote jobs', () => {
    const onsiteJob = testData.job({ isRemote: false })
    render(<JobCard job={onsiteJob} />)

    expect(screen.queryByText('Remote')).not.toBeInTheDocument()
  })

  it('should display skills correctly', () => {
    render(<JobCard job={defaultJob} />)

    defaultJob.skills.forEach(jobSkill => {
      expect(screen.getByText(jobSkill.skill.name)).toBeInTheDocument()
    })
  })

  it('should show application count', () => {
    render(<JobCard job={defaultJob} />)

    expect(screen.getByText(`${defaultJob._count.applications} applications`)).toBeInTheDocument()
  })

  it('should display published date', () => {
    render(<JobCard job={defaultJob} />)

    expect(screen.getByText(/Posted/)).toBeInTheDocument()
  })

  it('should handle different job statuses', () => {
    const draftJob = testData.job({ status: 'DRAFT' })
    render(<JobCard job={draftJob} />)

    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByText('Draft')).toHaveClass('bg-gray-100', 'text-gray-800')
  })

  it('should handle different employment types', () => {
    const partTimeJob = testData.job({ employmentType: 'PART_TIME' })
    render(<JobCard job={partTimeJob} />)

    expect(screen.getByText('Part Time')).toBeInTheDocument()
  })

  it('should handle different experience levels', () => {
    const seniorJob = testData.job({ experienceLevel: 'SENIOR' })
    render(<JobCard job={seniorJob} />)

    expect(screen.getByText('Senior')).toBeInTheDocument()
  })

  it('should format salary range correctly', () => {
    const highSalaryJob = testData.job({ 
      salaryMin: 100000, 
      salaryMax: 150000,
      currency: 'USD'
    })
    render(<JobCard job={highSalaryJob} />)

    expect(screen.getByText('$100,000')).toBeInTheDocument()
    expect(screen.getByText('$150,000')).toBeInTheDocument()
  })

  it('should handle jobs without company logo', () => {
    const jobWithoutLogo = testData.job({
      employer: {
        ...defaultJob.employer,
        employerProfile: {
          ...defaultJob.employer.employerProfile,
          companyLogo: null,
        },
      },
    })

    render(<JobCard job={jobWithoutLogo} />)

    // Should render company name without logo
    expect(screen.getByText(jobWithoutLogo.employer.employerProfile.companyName)).toBeInTheDocument()
  })

  it('should handle empty skills array', () => {
    const jobWithoutSkills = testData.job({ skills: [] })
    render(<JobCard job={jobWithoutSkills} />)

    // Should not crash and should render other job information
    expect(screen.getByText(jobWithoutSkills.title)).toBeInTheDocument()
  })

  it('should apply hover effects', () => {
    render(<JobCard job={defaultJob} />)

    const jobCard = screen.getByRole('article')
    expect(jobCard).toHaveClass('hover:shadow-md')
  })

  it('should be accessible with proper ARIA labels', () => {
    render(<JobCard job={defaultJob} />)

    const jobCard = screen.getByRole('article')
    expect(jobCard).toHaveAttribute('aria-label', expect.stringContaining(defaultJob.title))
  })

  it('should handle truncation of long descriptions', () => {
    const longDescription = 'This is a very long job description that should be truncated when displayed in the job card component to maintain proper layout and readability. '.repeat(10)
    const jobWithLongDescription = testData.job({ description: longDescription })
    
    render(<JobCard job={jobWithLongDescription} />)

    // Should render the description but potentially truncated
    expect(screen.getByText(longDescription, { exact: false })).toBeInTheDocument()
  })

  it('should display different currencies correctly', () => {
    const eurJob = testData.job({ 
      salaryMin: 50000, 
      salaryMax: 70000,
      currency: 'EUR'
    })
    
    render(<JobCard job={eurJob} />)

    expect(screen.getByText('€50,000')).toBeInTheDocument()
    expect(screen.getByText('€70,000')).toBeInTheDocument()
  })

  it('should handle missing salary information', () => {
    const jobWithoutSalary = testData.job({ 
      salaryMin: null, 
      salaryMax: null 
    })
    
    render(<JobCard job={jobWithoutSalary as any} />)

    // Should not crash and should display other information
    expect(screen.getByText(jobWithoutSalary.title)).toBeInTheDocument()
    expect(screen.queryByText('$')).not.toBeInTheDocument()
  })
})