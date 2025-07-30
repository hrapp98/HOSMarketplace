#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing Replit setup issues...\n');

// Check if we're in Replit environment
const isReplit = process.env.REPL_SLUG || process.env.REPLIT_DB_URL;

if (isReplit) {
  console.log('✅ Replit environment detected');
  
  // Replace package.json with simplified version
  const simplifiedPackage = path.join(__dirname, '..', 'package-replit.json');
  const mainPackage = path.join(__dirname, '..', 'package.json');
  
  if (fs.existsSync(simplifiedPackage)) {
    console.log('📦 Using simplified package.json for Replit...');
    
    // Backup original
    fs.copyFileSync(mainPackage, mainPackage + '.full.backup');
    
    // Use simplified package.json
    fs.copyFileSync(simplifiedPackage, mainPackage);
    console.log('✅ Simplified package.json activated');
  }
  
  // Use SQLite schema for Replit
  const sqliteSchema = path.join(__dirname, '..', 'prisma', 'schema-sqlite.prisma');
  const mainSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  if (fs.existsSync(sqliteSchema)) {
    console.log('📄 Switching to SQLite schema...');
    
    // Backup original schema
    if (fs.existsSync(mainSchema)) {
      fs.copyFileSync(mainSchema, mainSchema + '.postgres.backup');
    }
    
    // Use SQLite schema
    fs.copyFileSync(sqliteSchema, mainSchema);
    console.log('✅ SQLite schema activated');
  }
  
  // Create environment file
  const envFile = path.join(__dirname, '..', '.env');
  const replUrl = process.env.REPL_SLUG && process.env.REPL_OWNER 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : 'http://localhost:3000';
    
  const envContent = `# Auto-generated for Replit
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="hireoverseas-development-secret-key-2024-${Math.random().toString(36).substring(7)}"
NEXTAUTH_URL="${replUrl}"
SKIP_ENV_VALIDATION="true"

# Mock services to prevent errors
STRIPE_SECRET_KEY="sk_test_mock"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_mock"
CLOUDINARY_CLOUD_NAME="mock"
CLOUDINARY_API_KEY="mock"
CLOUDINARY_API_SECRET="mock"
EMAIL_FROM="noreply@hireoverseas.com"
SMTP_HOST="localhost"
SMTP_PORT="587"
SMTP_USER="mock"
SMTP_PASSWORD="mock"
`;
  
  fs.writeFileSync(envFile, envContent);
  console.log('✅ Environment file created');

  // Clean npm cache and node_modules
  console.log('🧹 Cleaning up...');
  try {
    if (fs.existsSync('node_modules')) {
      execSync('rm -rf node_modules', { stdio: 'inherit' });
    }
    if (fs.existsSync('package-lock.json')) {
      fs.unlinkSync('package-lock.json');
    }
    console.log('✅ Cleanup complete');
  } catch (error) {
    console.log('⚠️  Cleanup had some issues (continuing anyway)');
  }

  // Install dependencies
  console.log('📦 Installing dependencies...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Dependencies installed');
  } catch (error) {
    console.log('❌ npm install failed. Try running: npm install --legacy-peer-deps --force');
  }

  // Generate Prisma client
  console.log('🔄 Setting up database...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database setup complete');
  } catch (error) {
    console.log('❌ Database setup failed. Try running manually:');
    console.log('   npx prisma generate');
    console.log('   npx prisma db push');
  }
  
} else {
  console.log('ℹ️  Not in Replit environment');
}

console.log('\n🎉 Setup attempt complete!');
console.log('If successful, run: npm run dev');
console.log('If there are still errors, try these commands manually:');
console.log('1. npm install --legacy-peer-deps --force');
console.log('2. npx prisma generate');
console.log('3. npx prisma db push');
console.log('4. npm run dev');