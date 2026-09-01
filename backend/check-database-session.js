require('dotenv').config();
const { Pool } = require('pg');

async function checkDatabaseSession() {
  console.log('=== STEP 6: Database Check ===\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    // Check the column type for payment_session_id
    console.log('1. Checking payment_session_id column type...');
    const columnQuery = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'payments'
      AND column_name = 'payment_session_id'
    `;

    const columnResult = await pool.query(columnQuery);
    if (columnResult.rows.length > 0) {
      const columnInfo = columnResult.rows[0];
      console.log('Column Name:', columnInfo.column_name);
      console.log('Data Type:', columnInfo.data_type);
      console.log('Max Length:', columnInfo.character_maximum_length);
      console.log('Nullable:', columnInfo.is_nullable);
    } else {
      console.log('ERROR: payment_session_id column not found in payments table');
    }
    console.log('');

    // Get the most recent payment record
    console.log('2. Checking most recent payment record...');
    const paymentQuery = `
      SELECT
        id,
        order_id,
        amount,
        payment_method,
        payment_status,
        cashfree_order_id,
        payment_session_id,
        cf_order_status,
        created_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const paymentResult = await pool.query(paymentQuery);
    if (paymentResult.rows.length > 0) {
      const payment = paymentResult.rows[0];
      console.log('Payment ID:', payment.id);
      console.log('Order ID:', payment.order_id);
      console.log('Amount:', payment.amount);
      console.log('Payment Method:', payment.payment_method);
      console.log('Payment Status:', payment.payment_status);
      console.log('Cashfree Order ID:', payment.cashfree_order_id);

      if (payment.payment_session_id) {
        console.log('');
        console.log('=== Payment Session ID Analysis ===');
        console.log('Type:', typeof payment.payment_session_id);
        console.log('Length:', payment.payment_session_id.length);
        console.log('Prefix:', payment.payment_session_id.substring(0, 8));
        console.log('Suffix:', payment.payment_session_id.substring(payment.payment_session_id.length - 8));
        console.log('Is non-empty string:', payment.payment_session_id.length > 0);
        console.log('Starts with "session_":', payment.payment_session_id.startsWith('session_'));
      } else {
        console.log('ERROR: No payment_session_id in database');
      }

      console.log('');
      console.log('CF Order Status:', payment.cf_order_status);
    } else {
      console.log('ERROR: No payment records found');
    }

    console.log('');
    console.log('=== Database Schema Analysis ===');
    if (columnResult.rows.length > 0) {
      const columnInfo = columnResult.rows[0];
      const maxLength = columnInfo.character_maximum_length;
      const sessionLength = paymentResult.rows[0]?.payment_session_id?.length || 0;

      console.log('Column Max Length:', maxLength);
      console.log('Actual Session ID Length:', sessionLength);

      if (maxLength && sessionLength > maxLength) {
        console.log('WARNING: Session ID exceeds column max length - TRUNCATION MAY OCCUR!');
      } else if (maxLength && sessionLength <= maxLength) {
        console.log('✓ Session ID fits within column max length');
      } else {
        console.log('Cannot determine if truncation is occurring');
      }
    }

  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDatabaseSession().then(() => {
  console.log('\n=== Database Check Complete ===');
  process.exit(0);
}).catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});