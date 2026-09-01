const fs = require('fs');
const path = require('path');

const envFilePath = path.join(__dirname, '.env');

console.log('=== Cashfree Configuration Setup ===\n');
console.log('This script will help you add Cashfree TEST credentials to your .env file.\n');

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter your Cashfree TEST App ID: ', (clientId) => {
  rl.question('Enter your Cashfree TEST Secret Key: ', (clientSecret) => {
    rl.close();

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

      // Append Cashfree configuration if not already present
      if (!existingContent.includes('CASHFREE_CLIENT_ID')) {
        const newContent = existingContent + envContent;
        fs.writeFileSync(envFilePath, newContent);
        console.log('\n✓ Cashfree credentials added to .env file');
        console.log('✓ Please restart your backend server with: npm run dev');
      } else {
        console.log('\n✓ Cashfree credentials already exist in .env file');
        console.log('✓ Please restart your backend server with: npm run dev');
      }
    } catch (error) {
      console.error('\n✗ Error updating .env file:', error.message);
      console.log('\nPlease manually add the following to your backend/.env file:');
      console.log(envContent);
    }
  });
});