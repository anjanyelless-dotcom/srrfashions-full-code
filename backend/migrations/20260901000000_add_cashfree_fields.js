exports.up = (pgm) => {
  // Add Cashfree fields to payments table
  pgm.addColumns('payments', {
    cashfree_order_id: { type: 'varchar(100)' },
    cashfree_payment_id: { type: 'varchar(100)' },
    payment_session_id: { type: 'varchar(255)' },
    cf_order_status: { type: 'varchar(50)' },
    webhook_processed: { type: 'boolean', notNull: true, default: false },
    webhook_received_at: { type: 'timestamp' }
  });

  // Add index on payment_session_id for faster lookups
  pgm.createIndex('payments', 'payment_session_id');
  pgm.createIndex('payments', 'cashfree_order_id');
};

exports.down = (pgm) => {
  // Remove Cashfree fields from payments table
  pgm.dropColumns('payments', [
    'cashfree_order_id',
    'cashfree_payment_id', 
    'payment_session_id',
    'cf_order_status',
    'webhook_processed',
    'webhook_received_at'
  ]);
};