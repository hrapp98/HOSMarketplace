// E2E tests for messaging workflows
import { test, expect } from '@playwright/test'
import { createHelpers, testUsers, testJobs } from './utils/test-helpers'

test.describe('Messaging Workflows', () => {
  test.describe('Direct Messaging', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Setup: Create employer with job and freelancer with application
      await helpers.auth.register(testUsers.employer)
      await helpers.jobs.createJob(testJobs.frontendDeveloper)
      await helpers.auth.logout()
      
      await helpers.auth.register(testUsers.freelancer)
      await helpers.nav.goToJobsPage()
      await page.click('[data-testid="job-card"]:first-child')
      await helpers.jobs.applyToJob('I am interested in this position.', 75)
    })

    test('should initiate conversation from job application', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Logout freelancer and login as employer
      await helpers.auth.logout()
      await helpers.auth.login(testUsers.employer.email, testUsers.employer.password)
      
      // Go to applications and start conversation
      await page.goto('/dashboard/applications')
      await page.click('[data-testid="view-application"]')
      await page.click('[data-testid="message-applicant"]')
      
      // Verify messaging interface opens
      await helpers.assert.expectElementToBeVisible('[data-testid="messaging-modal"]')
      await helpers.assert.expectElementToContainText('[data-testid="chat-header"]', testUsers.freelancer.firstName)
      
      // Send initial message
      const initialMessage = 'Hi! I reviewed your application and I\'m interested in discussing the position further. Are you available for a quick call this week?'
      await page.fill('textarea[data-testid="message-input"]', initialMessage)
      await page.click('[data-testid="send-message"]')
      
      // Verify message is sent
      await helpers.assert.expectElementToBeVisible('[data-testid="message-bubble"]')
      await helpers.assert.expectElementToContainText('[data-testid="message-content"]', initialMessage)
      await helpers.wait.waitForToast('Message sent')
    })

    test('should send and receive messages in real-time', async ({ page, context }) => {
      const helpers = createHelpers(page)
      
      // Open second browser tab for freelancer
      const freelancerPage = await context.newPage()
      const freelancerHelpers = createHelpers(freelancerPage)
      
      // Employer starts conversation
      await helpers.auth.logout()
      await helpers.auth.login(testUsers.employer.email, testUsers.employer.password)
      
      await page.goto('/dashboard/messages')
      await page.click('[data-testid="start-new-conversation"]')
      await page.fill('input[data-testid="search-users"]', testUsers.freelancer.email)
      await page.click('[data-testid="user-result"]:first-child')
      
      // Send message from employer
      await page.fill('textarea[data-testid="message-input"]', 'Hello! How are you?')
      await page.click('[data-testid="send-message"]')
      
      // Login as freelancer in second tab
      await freelancerHelpers.nav.goToHomePage()
      await freelancerHelpers.auth.login(testUsers.freelancer.email, testUsers.freelancer.password)
      
      // Check for message notification
      await freelancerPage.goto('/dashboard/messages')
      await freelancerHelpers.assert.expectElementToBeVisible('[data-testid="unread-message"]')
      
      // Open conversation and reply
      await freelancerPage.click('[data-testid="conversation-item"]:first-child')
      await freelancerHelpers.assert.expectElementToContainText('[data-testid="message-content"]', 'Hello! How are you?')
      
      // Reply from freelancer
      await freelancerPage.fill('textarea[data-testid="message-input"]', 'Hi! I\'m doing well, thanks for reaching out!')
      await freelancerPage.click('[data-testid="send-message"]')
      
      // Verify employer receives the reply (in real app, this would be via websockets)
      await page.reload()
      await helpers.assert.expectElementToContainText('[data-testid="message-content"]:last-child', 'I\'m doing well')
    })

    test('should handle file attachments in messages', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Setup conversation
      await helpers.auth.logout()
      await helpers.auth.login(testUsers.employer.email, testUsers.employer.password)
      
      await page.goto('/dashboard/messages')
      await page.click('[data-testid="start-new-conversation"]')
      await page.fill('input[data-testid="search-users"]', testUsers.freelancer.email)
      await page.click('[data-testid="user-result"]:first-child')
      
      // Attach file to message
      await page.click('[data-testid="attach-file"]')
      
      // Create a test file
      const testFilePath = './e2e/fixtures/test-document.pdf'
      await page.setInputFiles('input[data-testid="file-input"]', testFilePath)
      
      // Add message with attachment
      await page.fill('textarea[data-testid="message-input"]', 'Please find the project requirements attached.')
      await page.click('[data-testid="send-message"]')
      
      // Verify attachment is shown
      await helpers.assert.expectElementToBeVisible('[data-testid="message-attachment"]')
      await helpers.assert.expectElementToContainText('[data-testid="attachment-name"]', 'test-document.pdf')
    })

    test('should mark messages as read', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Login as freelancer and go to messages
      await page.goto('/dashboard/messages')
      
      // Verify unread message indicator
      await helpers.assert.expectElementToBeVisible('[data-testid="unread-indicator"]')
      
      // Open conversation
      await page.click('[data-testid="conversation-item"]:first-child')
      
      // Verify messages are marked as read
      await helpers.assert.expectElementToBeHidden('[data-testid="unread-indicator"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="read-receipt"]')
    })

    test('should search through conversation history', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/messages')
      
      // Open conversation with message history
      await page.click('[data-testid="conversation-item"]:first-child')
      
      // Use search functionality
      await page.click('[data-testid="search-messages"]')
      await page.fill('input[data-testid="message-search"]', 'project')
      await page.press('input[data-testid="message-search"]', 'Enter')
      
      // Verify search results
      await helpers.assert.expectElementToBeVisible('[data-testid="search-results"]')
      await helpers.assert.expectElementToContainText('[data-testid="search-highlight"]', 'project')
    })
  })

  test.describe('Message Management', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should organize conversations by status', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/messages')
      
      // Verify conversation filters
      await helpers.assert.expectElementToBeVisible('[data-testid="conversation-filters"]')
      
      // Filter by unread messages
      await page.click('[data-testid="filter-unread"]')
      await helpers.wait.waitForPageLoad()
      
      // Verify only unread conversations are shown
      const conversations = page.locator('[data-testid="conversation-item"]')
      for (let i = 0; i < await conversations.count(); i++) {
        await expect(conversations.nth(i)).toHaveClass(/unread/)
      }
      
      // Filter by active projects
      await page.click('[data-testid="filter-active"]')
      await helpers.wait.waitForPageLoad()
      
      // Verify active project conversations
      await helpers.assert.expectElementToBeVisible('[data-testid="active-project-badge"]')
    })

    test('should archive conversations', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/messages')
      
      // Archive a conversation
      await page.hover('[data-testid="conversation-item"]:first-child')
      await page.click('[data-testid="archive-conversation"]')
      
      // Verify archive confirmation
      await helpers.wait.waitForToast('Conversation archived')
      
      // Check archived conversations
      await page.click('[data-testid="view-archived"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="archived-conversation"]')
      
      // Unarchive conversation
      await page.click('[data-testid="unarchive-conversation"]')
      await helpers.wait.waitForToast('Conversation restored')
    })

    test('should block and report users', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/messages')
      await page.click('[data-testid="conversation-item"]:first-child')
      
      // Open conversation options
      await page.click('[data-testid="conversation-options"]')
      
      // Report user
      await page.click('[data-testid="report-user"]')
      
      // Fill report form
      await page.selectOption('select[data-testid="report-reason"]', 'spam')
      await page.fill('textarea[data-testid="report-details"]', 'This user is sending inappropriate messages.')
      await page.click('[data-testid="submit-report"]')
      
      // Verify report submission
      await helpers.wait.waitForToast('Report submitted')
      
      // Block user
      await page.click('[data-testid="conversation-options"]')
      await page.click('[data-testid="block-user"]')
      
      // Confirm blocking
      await page.click('[data-testid="confirm-block"]')
      await helpers.wait.waitForToast('User blocked')
      
      // Verify conversation is hidden
      await helpers.assert.expectElementToBeHidden('[data-testid="message-input"]')
      await helpers.assert.expectElementToBeVisible('[data-testid="blocked-user-notice"]')
    })

    test('should handle message delivery status', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/messages')
      await page.click('[data-testid="conversation-item"]:first-child')
      
      // Send a message
      await page.fill('textarea[data-testid="message-input"]', 'Test message for delivery status')
      await page.click('[data-testid="send-message"]')
      
      // Verify delivery status indicators
      await helpers.assert.expectElementToBeVisible('[data-testid="message-sent"]')
      
      // Simulate message delivered
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('message-delivered', {
          detail: { messageId: 'test-message-id' }
        }))
      })
      
      await helpers.assert.expectElementToBeVisible('[data-testid="message-delivered"]')
      
      // Simulate message read
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('message-read', {
          detail: { messageId: 'test-message-id' }
        }))
      })
      
      await helpers.assert.expectElementToBeVisible('[data-testid="message-read"]')
    })
  })

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.freelancer)
    })

    test('should configure message notification preferences', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/settings/notifications')
      
      // Configure message notifications
      await page.check('input[data-testid="email-notifications"]')
      await page.check('input[data-testid="browser-notifications"]')
      await page.uncheck('input[data-testid="mobile-notifications"]')
      
      // Set notification frequency
      await page.selectOption('select[data-testid="notification-frequency"]', 'IMMEDIATE')
      
      // Configure quiet hours
      await page.check('input[data-testid="enable-quiet-hours"]')
      await page.selectOption('select[data-testid="quiet-start"]', '22:00')
      await page.selectOption('select[data-testid="quiet-end"]', '08:00')
      
      // Save notification settings
      await page.click('[data-testid="save-notification-settings"]')
      
      // Verify settings saved
      await helpers.wait.waitForToast('Notification settings saved')
    })

    test('should test browser notification permissions', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/settings/notifications')
      
      // Request notification permission
      await page.click('[data-testid="enable-browser-notifications"]')
      
      // Mock permission grant (in real browser, this would show permission dialog)
      await page.evaluate(() => {
        // Override Notification.permission for testing
        Object.defineProperty(Notification, 'permission', {
          value: 'granted',
          writable: false
        })
      })
      
      // Verify permission status
      await helpers.assert.expectElementToBeVisible('[data-testid="notifications-enabled"]')
      await helpers.assert.expectElementToContainText('[data-testid="permission-status"]', 'Notifications enabled')
      
      // Test notification
      await page.click('[data-testid="test-notification"]')
      
      // In a real test, you would verify the notification appears
      await helpers.wait.waitForToast('Test notification sent')
    })
  })

  test.describe('Message Templates and Quick Replies', () => {
    test.beforeEach(async ({ page }) => {
      const helpers = createHelpers(page)
      await helpers.auth.register(testUsers.employer)
    })

    test('should create and use message templates', async ({ page }) => {
      const helpers = createHelpers(page)
      
      // Go to message templates settings
      await page.goto('/dashboard/settings/message-templates')
      
      // Create a new template
      await page.click('[data-testid="create-template"]')
      await page.fill('input[data-testid="template-name"]', 'Interview Invitation')
      await page.fill('textarea[data-testid="template-content"]', 'Hi {{name}}, thank you for your application. We would like to invite you for an interview. Are you available this {{day}} at {{time}}?')
      
      // Add template variables
      await page.click('[data-testid="add-variable"]')
      await page.fill('input[data-testid="variable-name"]', 'name')
      await page.fill('input[data-testid="variable-default"]', 'Candidate')
      
      await page.click('[data-testid="save-template"]')
      await helpers.wait.waitForToast('Template saved')
      
      // Use template in conversation
      await page.goto('/dashboard/messages')
      await page.click('[data-testid="conversation-item"]:first-child')
      
      // Select template
      await page.click('[data-testid="use-template"]')
      await page.selectOption('select[data-testid="template-select"]', 'Interview Invitation')
      
      // Fill template variables
      await page.fill('input[data-testid="var-name"]', 'John')
      await page.fill('input[data-testid="var-day"]', 'Friday')
      await page.fill('input[data-testid="var-time"]', '2:00 PM')
      
      await page.click('[data-testid="insert-template"]')
      
      // Verify template is inserted
      await helpers.assert.expectElementToContainText('textarea[data-testid="message-input"]', 'Hi John, thank you for your application')
    })

    test('should use quick reply suggestions', async ({ page }) => {
      const helpers = createHelpers(page)
      
      await page.goto('/dashboard/messages')
      await page.click('[data-testid="conversation-item"]:first-child')
      
      // Verify quick replies are shown
      await helpers.assert.expectElementToBeVisible('[data-testid="quick-replies"]')
      
      // Use a quick reply
      await page.click('[data-testid="quick-reply"]:has-text("Thank you for your interest")')
      
      // Verify text is inserted
      await helpers.assert.expectElementToContainText('textarea[data-testid="message-input"]', 'Thank you for your interest')
      
      // Send quick reply
      await page.click('[data-testid="send-message"]')
      
      // Verify message is sent
      await helpers.assert.expectElementToBeVisible('[data-testid="message-bubble"]:last-child')
    })
  })
})