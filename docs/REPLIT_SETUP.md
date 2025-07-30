# HireOverseas Marketplace - Replit Setup Guide

This guide will help you deploy the HireOverseas Marketplace on Replit.

## 🚀 Quick Start

### 1. Import to Replit
1. Go to [Replit](https://replit.com)
2. Click "Create Repl"
3. Select "Import from GitHub"
4. Enter repository URL: `https://github.com/hrapp98/HOSMarketplace.git`
5. Click "Import from GitHub"

### 2. Required External Services

#### A. Database - Neon PostgreSQL (Free)
1. Go to [Neon](https://neon.tech)
2. Create a free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://username:password@host/database`)

#### B. Redis - Upstash (Free)
1. Go to [Upstash](https://upstash.com)
2. Create a free account
3. Create a Redis database
4. Copy the connection URL

#### C. File Storage - Cloudinary (Free)
1. Go to [Cloudinary](https://cloudinary.com)
2. Create a free account
3. Get your Cloud Name, API Key, and API Secret from the dashboard

#### D. Email Service - Resend (Free)
1. Go to [Resend](https://resend.com)
2. Create a free account
3. Generate an API key

#### E. Payments - Stripe (Test Mode)
1. Go to [Stripe](https://stripe.com)
2. Create an account
3. Get your test API keys (publishable and secret)

### 3. Environment Variables Setup

In your Replit project, go to the "Secrets" tab and add these environment variables:

#### Required Variables
```
# Database
DATABASE_URL=postgresql://username:password@host/database

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here-make-it-long-and-random
NEXTAUTH_URL=https://your-repl-name.username.repl.co

# Redis Cache
REDIS_URL=redis://:password@host:port

# Email Service
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=HireOverseas
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=resend
SMTP_PASSWORD=your-resend-api-key

# File Storage
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Payments (Test Mode)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional Analytics
GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

#### Optional Variables
```
# Error Tracking
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# AI Features (OpenAI)
OPENAI_API_KEY=sk-...

# Advanced Features
JWT_SECRET=another-secret-key
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Setup Database

Once your Replit is running:

1. Open the Shell in Replit
2. Run the database setup commands:
```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed with sample data
npx prisma db seed
```

### 5. Test the Application

1. Click the "Run" button in Replit
2. Wait for the build to complete
3. Your app should be available at the URL shown (something like `https://your-repl-name.username.repl.co`)

## 📋 Troubleshooting

### Common Issues

#### 1. Database Connection Error
- Make sure your `DATABASE_URL` is correct
- Ensure your Neon database is active (free tier sleeps after inactivity)

#### 2. Build Errors
- Run `npm install` in the Shell
- Check if all environment variables are set
- Try `npm run build` manually to see specific errors

#### 3. Prisma Issues
```bash
# Reset Prisma client
rm -rf node_modules/.prisma
npx prisma generate

# If schema issues:
npx prisma db push --force-reset
```

#### 4. Memory Issues
- Replit free tier has memory limits
- Try restarting your Repl
- Consider upgrading to Replit Core for more resources

### 5. Port Issues
- The app runs on port 3000 by default
- Replit should automatically handle port forwarding
- If issues, check the `.replit` file configuration

## 🔧 Development Tips

### Hot Reload
- Changes to code will automatically restart the server
- Database changes require running `npx prisma db push`

### Logs
- Check the Console tab in Replit for application logs
- Use `console.log()` for debugging

### Database Management
```bash
# View database in browser
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset

# View database schema
npx prisma db pull
```

## 🚀 Going Live

### Custom Domain (Replit Core required)
1. Upgrade to Replit Core
2. Go to your Repl settings
3. Add your custom domain
4. Update `NEXTAUTH_URL` environment variable

### Production Checklist
- [ ] Use production database (not test/development)
- [ ] Set up Stripe live keys (not test keys)
- [ ] Configure proper email domain
- [ ] Set up error monitoring (Sentry)
- [ ] Enable analytics
- [ ] Test all features thoroughly

## 📞 Support

If you encounter issues:

1. Check the [Replit Documentation](https://docs.replit.com)
2. Join the [Replit Discord](https://discord.gg/replit)
3. Create an issue in the [GitHub repository](https://github.com/hrapp98/HOSMarketplace/issues)

## 🔒 Security Notes

- Never commit API keys to GitHub
- Use strong, unique secrets for production
- Regularly rotate API keys
- Monitor for security issues with the included security scanning

Your HireOverseas Marketplace should now be running on Replit! 🎉