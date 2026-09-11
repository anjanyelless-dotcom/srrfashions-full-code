const pool = require('../src/config/database');

async function up() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        offer_id INTEGER REFERENCES offers(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        template_id VARCHAR(100),
        sender_id VARCHAR(100),
        status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
        total_recipients INTEGER DEFAULT 0,
        sent_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT sms_campaigns_status_check CHECK (status IN ('DRAFT', 'SENDING', 'COMPLETED', 'PARTIALLY_FAILED', 'FAILED'))
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaigns_offer_id ON sms_campaigns(offer_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaigns_status ON sms_campaigns(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaigns_created_at ON sms_campaigns(created_at DESC)
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS sms_campaign_recipients (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES sms_campaigns(id) ON DELETE CASCADE,
        customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        mobile VARCHAR(20) NOT NULL,
        provider_message_id VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
        error_message TEXT,
        sent_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT sms_campaign_recipients_status_check CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'DELIVERED'))
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_campaign_id ON sms_campaign_recipients(campaign_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_customer_id ON sms_campaign_recipients(customer_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_mobile ON sms_campaign_recipients(mobile)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_status ON sms_campaign_recipients(status)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sms_campaign_recipients_provider_message_id ON sms_campaign_recipients(provider_message_id)
    `);

    await client.query('COMMIT');
    console.log('Migration up: create_sms_campaigns completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration up failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function down() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query('DROP TABLE IF EXISTS sms_campaign_recipients CASCADE');
    await client.query('DROP TABLE IF EXISTS sms_campaigns CASCADE');

    await client.query('COMMIT');
    console.log('Migration down: create_sms_campaigns completed');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration down failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  const action = process.argv[2];
  if (action === 'up') {
    up().then(() => process.exit(0)).catch(() => process.exit(1));
  } else if (action === 'down') {
    down().then(() => process.exit(0)).catch(() => process.exit(1));
  } else {
    console.log('Usage: node migration.js up|down');
    process.exit(1);
  }
}

module.exports = { up, down };
