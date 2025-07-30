# Deployment Guide

This document outlines the deployment process for the HireOverseas Marketplace application.

## Table of Contents

- [Overview](#overview)
- [Environments](#environments)
- [Prerequisites](#prerequisites)
- [CI/CD Pipeline](#cicd-pipeline)
- [Manual Deployment](#manual-deployment)
- [Database Migrations](#database-migrations)
- [Monitoring and Logging](#monitoring-and-logging)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

## Overview

The application uses a comprehensive CI/CD pipeline built with GitHub Actions that includes:

- **Continuous Integration**: Automated testing, linting, security scanning
- **Continuous Deployment**: Automated deployment to staging and production
- **Quality Gates**: Performance testing, security checks, code coverage
- **Infrastructure**: Docker containerization with monitoring and logging

## Environments

### Development
- **URL**: http://localhost:3000
- **Database**: Local PostgreSQL via Docker
- **Branch**: Any feature branch
- **Deployment**: Manual via `npm run dev`

### Staging
- **URL**: https://staging.hireoverseas.com
- **Database**: Staging PostgreSQL instance
- **Branch**: `develop`
- **Deployment**: Automatic on push to `develop`

### Production
- **URL**: https://hireoverseas.com
- **Database**: Production PostgreSQL instance
- **Branch**: `main`
- **Deployment**: Automatic on push to `main` or manual trigger

## Prerequisites

### GitHub Secrets

Configure the following secrets in your GitHub repository:

#### Staging Environment
```
STAGING_HOST=your-staging-server.com
STAGING_USER=ubuntu
STAGING_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
STAGING_PORT=22
STAGING_POSTGRES_PASSWORD=secure_password
STAGING_REDIS_PASSWORD=secure_password
STAGING_NEXTAUTH_SECRET=your_nextauth_secret
STAGING_NEXTAUTH_URL=https://staging.hireoverseas.com
STAGING_STRIPE_SECRET_KEY=sk_test_...
STAGING_STRIPE_PUBLISHABLE_KEY=pk_test_...
STAGING_STRIPE_WEBHOOK_SECRET=whsec_...
STAGING_CLOUDINARY_CLOUD_NAME=your_cloud_name
STAGING_CLOUDINARY_API_KEY=your_api_key
STAGING_CLOUDINARY_API_SECRET=your_api_secret
STAGING_EMAIL_FROM=noreply@staging.hireoverseas.com
STAGING_EMAIL_HOST=smtp.your-provider.com
STAGING_EMAIL_PORT=587
STAGING_EMAIL_USER=your_email_user
STAGING_EMAIL_PASS=your_email_password
STAGING_SENTRY_DSN=https://...@sentry.io/...
STAGING_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
```

#### Production Environment
```
PRODUCTION_HOST=your-production-server.com
PRODUCTION_USER=ubuntu
PRODUCTION_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
PRODUCTION_PORT=22
PRODUCTION_POSTGRES_PASSWORD=very_secure_password
PRODUCTION_REDIS_PASSWORD=very_secure_password
PRODUCTION_NEXTAUTH_SECRET=your_production_nextauth_secret
PRODUCTION_NEXTAUTH_URL=https://hireoverseas.com
PRODUCTION_STRIPE_SECRET_KEY=sk_live_...
PRODUCTION_STRIPE_PUBLISHABLE_KEY=pk_live_...
PRODUCTION_STRIPE_WEBHOOK_SECRET=whsec_...
PRODUCTION_CLOUDINARY_CLOUD_NAME=your_prod_cloud_name
PRODUCTION_CLOUDINARY_API_KEY=your_prod_api_key
PRODUCTION_CLOUDINARY_API_SECRET=your_prod_api_secret
PRODUCTION_EMAIL_FROM=noreply@hireoverseas.com
PRODUCTION_EMAIL_HOST=smtp.your-provider.com
PRODUCTION_EMAIL_PORT=587
PRODUCTION_EMAIL_USER=your_prod_email_user
PRODUCTION_EMAIL_PASS=your_prod_email_password
PRODUCTION_SENTRY_DSN=https://...@sentry.io/...
PRODUCTION_GOOGLE_ANALYTICS_ID=G-YYYYYYYYYY
PRODUCTION_GRAFANA_PASSWORD=secure_grafana_password
```

#### Additional Secrets
```
GITHUB_TOKEN=ghp_... (automatically provided)
SNYK_TOKEN=your_snyk_token
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
SECURITY_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token
```

### Server Setup

#### System Requirements
- Ubuntu 20.04+ or CentOS 7+
- Docker 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum (8GB recommended for production)
- 20GB disk space minimum

#### Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create deployment directories
sudo mkdir -p /opt/hireoverseas-staging
sudo mkdir -p /opt/hireoverseas-production
sudo mkdir -p /opt/backups
sudo chown -R $USER:$USER /opt/hireoverseas-*
sudo chown -R $USER:$USER /opt/backups

# Clone repository
cd /opt/hireoverseas-staging
git clone https://github.com/your-username/hireoverseas-marketplace.git .
git checkout develop

cd /opt/hireoverseas-production
git clone https://github.com/your-username/hireoverseas-marketplace.git .
git checkout main
```

## CI/CD Pipeline

### Workflow Overview

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Triggered on push to `main` or `develop`, and on PRs
   - Runs linting, type checking, security scans
   - Executes unit, integration, and E2E tests
   - Builds and pushes Docker images
   - Performs bundle analysis and performance testing

2. **Staging Deployment** (`.github/workflows/cd-staging.yml`)
   - Triggered on push to `develop` branch
   - Deploys to staging environment
   - Runs smoke tests
   - Sends notifications

3. **Production Deployment** (`.github/workflows/cd-production.yml`)
   - Triggered on push to `main` branch or manual trigger
   - Includes security checks and database backup
   - Blue-green deployment strategy
   - Comprehensive smoke testing
   - Monitoring dashboard updates

4. **Security Scanning** (`.github/workflows/security-scan.yml`)
   - Daily automated security scans
   - Dependency vulnerability checks
   - Code analysis with multiple tools
   - License compliance verification

5. **Performance Testing** (`.github/workflows/performance-testing.yml`)
   - Weekly performance and load testing
   - Lighthouse audits for web vitals
   - Bundle size monitoring
   - Database performance testing

### Manual Triggers

#### Deploy to Staging
```bash
# Push to develop branch
git checkout develop
git push origin develop
```

#### Deploy to Production
```bash
# Push to main branch
git checkout main
git push origin main

# Or trigger manually via GitHub Actions UI
```

#### Run Database Migration
```bash
# Via GitHub Actions UI
# Go to Actions → Database Migrations → Run workflow
# Select environment and migration type
```

## Manual Deployment

### Development Environment
```bash
# Clone repository
git clone https://github.com/your-username/hireoverseas-marketplace.git
cd hireoverseas-marketplace

# Install dependencies
npm install

# Setup database
docker-compose up -d postgres redis
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

### Production Environment (Manual)
```bash
# On production server
cd /opt/hireoverseas-production

# Pull latest changes
git pull origin main

# Build and deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --remove-orphans

# Run database migrations
docker-compose -f docker-compose.yml -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Verify deployment
curl -f http://localhost/health
```

## Database Migrations

### Automatic Migrations
Database migrations are automatically applied during deployment via the CI/CD pipeline.

### Manual Migration Management
Use the Database Migrations workflow for manual control:

1. Go to GitHub Actions → Database Migrations
2. Click "Run workflow"
3. Select parameters:
   - **Environment**: staging or production
   - **Migration Type**: deploy, reset, or rollback
   - **Rollback Steps**: number of migrations to rollback (if applicable)

### Local Development Migrations
```bash
# Create a new migration
npx prisma migrate dev --name your_migration_name

# Apply migrations
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

## Monitoring and Logging

### Application Monitoring
- **Grafana Dashboard**: http://your-server:3001
- **Prometheus Metrics**: http://your-server:9090
- **Health Checks**: http://your-server/health

### Log Access
```bash
# Application logs
docker-compose logs -f app

# Nginx logs
docker-compose logs -f nginx

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

### Error Tracking
- **Sentry**: Configured for error tracking and performance monitoring
- **Custom Analytics**: Google Analytics integration for user behavior

## Rollback Procedures

### Application Rollback
```bash
# On production server
cd /opt/hireoverseas-production

# Find previous image
docker images | grep hireoverseas-marketplace

# Update docker-compose to use previous image
# Then restart services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Database Rollback
1. Stop the application
2. Restore from backup:
   ```bash
   # Find backup file
   ls -la /opt/backups/

   # Restore database
   gunzip < /opt/backups/backup_file.sql.gz | docker exec -i hireoverseas-postgres psql -U hireoverseas_user -d hireoverseas_prod
   ```
3. Start application with previous version

### Emergency Rollback
For immediate rollback, use the manual deployment process with a previous stable commit:

```bash
# Checkout previous stable commit
git checkout <previous-stable-commit>

# Deploy immediately
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
```

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
docker-compose logs app

# Rebuild with no cache
docker-compose build --no-cache app
```

#### Database Connection Issues
```bash
# Check database status
docker-compose exec postgres pg_isready

# Check connection from app
docker-compose exec app npx prisma db execute --stdin < /dev/null
```

#### Performance Issues
```bash
# Check resource usage
docker stats

# Check disk space
df -h

# Check memory usage
free -h
```

#### SSL/HTTPS Issues
```bash
# Check certificate validity
openssl x509 -in /path/to/cert -text -noout

# Renew certificates (if using Let's Encrypt)
sudo certbot renew
```

### Support Contacts
- **DevOps Team**: devops@hireoverseas.com
- **Security Team**: security@hireoverseas.com
- **On-Call**: Slack #alerts channel

### Monitoring Alerts
- **Uptime**: Configured via external monitoring service
- **Performance**: Alerts when response time > 2s
- **Errors**: Alerts when error rate > 5%
- **Resource Usage**: Alerts when CPU > 80% or Memory > 90%