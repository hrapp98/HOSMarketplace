// Application form component tests
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApplicationForm } from '@/components/applications/application-form'
import { testData, testHelpers, renderWithProviders } from '@/lib/test-utils'
import userEvent from '@testing-library/user-event'

// Mock API endpoints
global.fetch = jest.fn()
const mockFetch = global.fetch as jest.Mock

describe('ApplicationForm Component', () => {
  const defaultJob = testData.job()
  const mockUser = {
    id: 'user-123',
    email: 'freelancer@example.com',
    role: 'FREELANCER',
    name: 'John Doe',
  }

  beforeEach(() => {
    jest.resetAllMocks()
    mockFetch.mockClear()
  })

  it('should render application form correctly', () => {
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    expect(screen.getByText(`Apply for ${defaultJob.title}`)).toBeInTheDocument()
    expect(screen.getByLabelText(/cover letter/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/proposed hourly rate/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit application/i })).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const submitButton = screen.getByRole('button', { name: /submit application/i })
    await user.click(submitButton)

    expect(screen.getByText(/cover letter is required/i)).toBeInTheDocument()
    expect(screen.getByText(/proposed rate is required/i)).toBeInTheDocument()
  })

  it('should validate cover letter minimum length', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const coverLetterInput = screen.getByLabelText(/cover letter/i)
    const submitButton = screen.getByRole('button', { name: /submit application/i })

    await user.type(coverLetterInput, 'Too short')
    await user.click(submitButton)

    expect(screen.getByText(/cover letter must be at least 50 characters/i)).toBeInTheDocument()
  })

  it('should validate proposed rate range', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const rateInput = screen.getByLabelText(/proposed hourly rate/i)
    const submitButton = screen.getByRole('button', { name: /submit application/i })

    // Test minimum rate
    await user.type(rateInput, '5')
    await user.click(submitButton)
    expect(screen.getByText(/rate must be between \$10 and \$500/i)).toBeInTheDocument()

    await user.clear(rateInput)
    
    // Test maximum rate
    await user.type(rateInput, '1000')
    await user.click(submitButton)
    expect(screen.getByText(/rate must be between \$10 and \$500/i)).toBeInTheDocument()
  })

  it('should submit application successfully', async () => {
    const user = userEvent.setup()
    const mockOnClose = jest.fn()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        application: { id: 'app-123' }
      })
    })

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={mockOnClose} />,
      { user: mockUser }
    )

    const coverLetter = "I am very interested in this position and believe my skills in React and TypeScript make me a great fit for your team. I have over 3 years of experience building modern web applications."
    const proposedRate = "75"

    await user.type(screen.getByLabelText(/cover letter/i), coverLetter)
    await user.type(screen.getByLabelText(/proposed hourly rate/i), proposedRate)
    
    const submitButton = screen.getByRole('button', { name: /submit application/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(`/api/jobs/${defaultJob.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coverLetter,
          proposedRate: parseInt(proposedRate),
        }),
      })
    })

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({
        error: 'You have already applied to this job'
      })
    })

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const coverLetter = "I am very interested in this position and believe my skills make me a great fit."
    await user.type(screen.getByLabelText(/cover letter/i), coverLetter)
    await user.type(screen.getByLabelText(/proposed hourly rate/i), "50")
    
    const submitButton = screen.getByRole('button', { name: /submit application/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('You have already applied to this job')).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const user = userEvent.setup()
    
    // Create a promise that doesn't resolve immediately
    let resolvePromise: (value: any) => void
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve
    })
    
    mockFetch.mockReturnValueOnce(pendingPromise)

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const coverLetter = "I am very interested in this position and believe my skills make me a great fit."
    await user.type(screen.getByLabelText(/cover letter/i), coverLetter)
    await user.type(screen.getByLabelText(/proposed hourly rate/i), "50")
    
    const submitButton = screen.getByRole('button', { name: /submit application/i })
    await user.click(submitButton)

    // Check loading state
    expect(screen.getByText(/submitting/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    // Resolve the promise
    resolvePromise!({
      ok: true,
      json: async () => ({ success: true, application: { id: 'app-123' } })
    })
  })

  it('should display job information in form header', () => {
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    expect(screen.getByText(defaultJob.title)).toBeInTheDocument()
    expect(screen.getByText(defaultJob.employer.employerProfile.companyName)).toBeInTheDocument()
  })

  it('should handle close button click', async () => {
    const user = userEvent.setup()
    const mockOnClose = jest.fn()

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={mockOnClose} />,
      { user: mockUser }
    )

    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should prevent submission for unauthenticated users', () => {
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />
      // No user provided
    )

    expect(screen.getByText(/please sign in to apply/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit application/i })).not.toBeInTheDocument()
  })

  it('should prevent employers from applying to jobs', () => {
    const employerUser = {
      id: 'employer-123',
      email: 'employer@example.com',
      role: 'EMPLOYER',
      name: 'Jane Smith',
    }

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: employerUser }
    )

    expect(screen.getByText(/only freelancers can apply/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /submit application/i })).not.toBeInTheDocument()
  })

  it('should handle network errors', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const coverLetter = "I am very interested in this position and believe my skills make me a great fit."
    await user.type(screen.getByLabelText(/cover letter/i), coverLetter)
    await user.type(screen.getByLabelText(/proposed hourly rate/i), "50")
    
    const submitButton = screen.getByRole('button', { name: /submit application/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to submit application/i)).toBeInTheDocument()
    })
  })

  it('should clear form after successful submission', async () => {
    const user = userEvent.setup()
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        application: { id: 'app-123' }
      })
    })

    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    const coverLetterInput = screen.getByLabelText(/cover letter/i)
    const rateInput = screen.getByLabelText(/proposed hourly rate/i)

    await user.type(coverLetterInput, "I am very interested in this position and believe my skills make me a great fit.")
    await user.type(rateInput, "50")
    
    const submitButton = screen.getByRole('button', { name: /submit application/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(coverLetterInput).toHaveValue('')
      expect(rateInput).toHaveValue('')
    })
  })

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <ApplicationForm job={defaultJob} onClose={() => {}} />,
      { user: mockUser }
    )

    // Tab through form elements
    await user.tab()
    expect(screen.getByLabelText(/cover letter/i)).toHaveFocus()

    await user.tab()
    expect(screen.getByLabelText(/proposed hourly rate/i)).toHaveFocus()

    await user.tab()
    expect(screen.getByRole('button', { name: /submit application/i })).toHaveFocus()
  })
})