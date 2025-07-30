// Global setup for Jest
module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.NEXTAUTH_SECRET = 'test-secret'
  process.env.NEXTAUTH_URL = 'http://localhost:3000'
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/hireoverseas_test'
  process.env.REDIS_URL = 'redis://localhost:6379/1'
  process.env.CLOUDINARY_CLOUD_NAME = 'test'
  process.env.CLOUDINARY_API_KEY = 'test'
  process.env.CLOUDINARY_API_SECRET = 'test'
  process.env.STRIPE_SECRET_KEY = 'sk_test_123'
  process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123'
  process.env.EMAIL_FROM = 'test@hireoverseas.com'
  process.env.EMAIL_HOST = 'smtp.test.com'
  process.env.EMAIL_PORT = '587'
  process.env.EMAIL_USER = 'test'
  process.env.EMAIL_PASS = 'test'
  
  console.log('🧪 Jest global setup completed')
}