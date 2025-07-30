#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up HireOverseas for Replit (Simple Mode)...\n');

// Check if we're in Replit environment
const isReplit = process.env.REPL_SLUG || process.env.REPLIT_DB_URL;

if (isReplit) {
  console.log('✅ Replit environment detected');
  
  // Use SQLite schema for Replit
  const sqliteSchema = path.join(__dirname, '..', 'prisma', 'schema-sqlite.prisma');
  const mainSchema = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  
  if (fs.existsSync(sqliteSchema)) {
    console.log('📄 Switching to SQLite schema for development...');
    
    // Backup original schema
    if (fs.existsSync(mainSchema)) {
      fs.copyFileSync(mainSchema, mainSchema + '.postgres.backup');
    }
    
    // Use SQLite schema
    fs.copyFileSync(sqliteSchema, mainSchema);
    console.log('✅ SQLite schema activated');
  }
  
  // Set environment variable for SQLite
  const envFile = path.join(__dirname, '..', '.env');
  const envContent = `# Auto-generated for Replit
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="hireoverseas-development-secret-key-2024"
NEXTAUTH_URL="${process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 'http://localhost:3000'}"
SKIP_ENV_VALIDATION="true"

# Mock services (replace with real ones later)
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

  // Install dependencies with legacy peer deps to avoid conflicts
  console.log('📦 Installing dependencies (this may take a moment)...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('⚠️  Some dependency warnings (this is normal)');
  }

  // Generate Prisma client
  console.log('🔄 Generating database client...');
  try {
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✅ Database client generated');
  } catch (error) {
    console.log('❌ Error generating Prisma client:', error.message);
  }

  // Push database schema
  console.log('🗄️  Setting up database...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✅ Database setup complete');
  } catch (error) {
    console.log('❌ Error setting up database:', error.message);
  }
  
} else {
  console.log('ℹ️  Not in Replit environment, using standard setup');
}

console.log('\n🎉 Setup complete! Next steps:');
console.log('1. Run: npm run dev');
console.log('\n📚 Your app will be available at the Replit URL!');
console.log('🔗 Look for the web preview or click the URL in the console');