require('dotenv-flow/config');

console.log('=== Cashfree Environment Configuration Check ===\n');

const requiredVars = [
  'CASHFREE_CLIENT_ID',
  'CASHFREE_CLIENT_SECRET', 
  'CASHFREE_BASE_URL',
  'CASHFREE_API_VERSION',
  'FRONTEND_URL',
  'BACKEND_URL'
];

let allConfigured = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  const isConfigured = !!value;
  if (!isConfigured) allConfigured = false;
  console.log(`${varName}: ${isConfigured ? '✓ configured' : '✗ NOT configured'}`);
});

console.log('\n=== Summary ===');
if (allConfigured) {
  console.log('✓ All required Cashfree environment variables are configured');
} else {
  console.log('✗ Some required Cashfree environment variables are missing');
  console.log('\nPlease add the following to your backend/.env file:');
  console.log('CASHFREE_CLIENT_ID=<your Cashfree TEST App ID>');
  console.log('CASHFREE_CLIENT_SECRET=<your Cashfree TEST Secret Key>');
  console.log('CASHFREE_API_VERSION=2026-01-01');
  console.log('CASHFREE_BASE_URL=https://sandbox.cashfree.com');
  console.log('FRONTEND_URL=http://localhost:5173');
  console.log('BACKEND_URL=http://localhost:3000');
}