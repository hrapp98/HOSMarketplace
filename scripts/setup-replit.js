#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up HireOverseas for Replit...\n');

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
  
} else {
  console.log('ℹ️  Not in Replit environment, using standard setup');
}

console.log('\n🎉 Setup complete! Next steps:');
console.log('1. Run: npx prisma generate');
console.log('2. Run: npx prisma db push');
console.log('3. Run: npm run dev');
console.log('\n📚 Your app will be available at the Replit URL!');