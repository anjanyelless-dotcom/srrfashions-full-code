require('dotenv-flow/config');
const app = require('./app');

const PORT = process.env.PORT || 3000;

// Cashfree configuration check
const cashfreeConfig = {
  clientId: !!process.env.CASHFREE_CLIENT_ID,
  clientSecret: !!process.env.CASHFREE_CLIENT_SECRET,
  baseUrl: !!process.env.CASHFREE_BASE_URL,
  apiVersion: !!process.env.CASHFREE_API_VERSION,
  frontendUrl: !!process.env.FRONTEND_URL,
  backendUrl: !!process.env.BACKEND_URL
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log('Cashfree Configuration:');
  console.log(`  CASHFREE_CLIENT_ID: ${cashfreeConfig.clientId ? 'configured' : 'NOT configured'}`);
  console.log(`  CASHFREE_CLIENT_SECRET: ${cashfreeConfig.clientSecret ? 'configured' : 'NOT configured'}`);
  console.log(`  CASHFREE_BASE_URL: ${cashfreeConfig.baseUrl ? 'configured' : 'NOT configured'}`);
  console.log(`  CASHFREE_API_VERSION: ${cashfreeConfig.apiVersion ? 'configured' : 'NOT configured'}`);
  console.log(`  FRONTEND_URL: ${cashfreeConfig.frontendUrl ? 'configured' : 'NOT configured'}`);
  console.log(`  BACKEND_URL: ${cashfreeConfig.backendUrl ? 'configured' : 'NOT configured'}`);
});