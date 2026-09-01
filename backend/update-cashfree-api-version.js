#!/usr/bin/env node

/**
 * Update Cashfree API Version to fix payment_session_id truncation issue
 *
 * ISSUE: Cashfree is returning truncated payment_session_id (148 characters)
 * instead of the expected longer session IDs (200+ characters), causing
 * "payment_session_id_invalid" errors.
 *
 * SOLUTION: Use API version 2023-08-01 which is known to work correctly
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('=== Cashfree API Version Update Helper ===\n');

if (!fs.existsSync(envPath)) {
  console.error('ERROR: .env file not found at:', envPath);
  console.error('Please ensure you are running this from the backend directory.');
  process.exit(1);
}

console.log('Reading .env file...');
const envContent = fs.readFileSync(envPath, 'utf8');

console.log('Checking current Cashfree API version...');
const currentVersion = envContent.match(/CASHFREE_API_VERSION=(.+)/);
if (currentVersion) {
  console.log('Current API version:', currentVersion[1]);
} else {
  console.log('No CASHFREE_API_VERSION found in .env');
}

console.log('\n=== INSTRUCTIONS ===');
console.log('To fix the payment_session_id truncation issue, please:');
console.log('1. Open your .env file');
console.log('2. Find the line: CASHFREE_API_VERSION=...');
console.log('3. Change it to: CASHFREE_API_VERSION=2023-08-01');
console.log('4. Save the file');
console.log('5. Restart your backend server');
console.log('\nThis API version is known to return valid payment_session_ids');

console.log('\n=== Alternatively, you can manually update .env ===');
const updatedContent = envContent.replace(
  /CASHFREE_API_VERSION=.+/,
  'CASHFREE_API_VERSION=2023-08-01'
);

if (envContent !== updatedContent) {
  console.log('I can update the .env file for you. Run:');
  console.log('node update-cashfree-api-version.js --update');
} else {
  console.log('Your .env file already has the correct API version.');
}

// Check for --update flag
if (process.argv.includes('--update')) {
  console.log('\n=== UPDATING .env FILE ===');
  fs.writeFileSync(envPath, updatedContent);
  console.log('✓ .env file updated successfully');
  console.log('✓ Please restart your backend server');
}