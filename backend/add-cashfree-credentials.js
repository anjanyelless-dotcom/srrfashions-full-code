const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname, '.env');

const clientId = process.argv[2];
const clientSecret = process.argv[3];

if (!clientId || !clientSecret) {
  console.log('Usage: node add-cashfree-credentials.js <CLIENT_ID> <CLIENT_SECRET>');
  console.log('');
  console.log('Example: node add-cashfree-credentials.js TEST123456 SECRET789012');
  process.exit(1);
}

const envContent = `
# Cashfree Payment Gateway (Sandbox)
CASHFREE_CLIENT_ID=${clientId}
CASHFREE_CLIENT_SECRET=${clientSecret}
CASHFREE_API_VERSION=2026-01-01
CASHFREE_BASE_URL=https://sandbox.cashfree.com

# Application URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
`;

try {
  // Check if .env file exists
  let existingContent = '';
  if (fs.existsSync(envFilePath)) {
    existingContent = fs.readFileSync(envFilePath, 'utf8');
  }

  // Check if Cashfree variables already exist
  if (existingContent.includes('CASHFREE_CLIENT_ID')) {
    console.log('Cashfree credentials already exist in .env file');
    console.log('To update, please manually edit backend/.env');
    process.exit(0);
  }

  // Append Cashfree configuration
  const newContent = existingContent + envContent;
  fs.writeFileSync(envFilePath, newContent);
  console.log('✓ Cashfree credentials added to .env file');
  console.log('✓ Please restart your backend server with: npm run dev');
} catch (error) {
  console.error('✗ Error updating .env file:', error.message);
  console.log('\nPlease manually add the following to your backend/.env file:');
  console.log(envContent);
  process.exit(1);
}