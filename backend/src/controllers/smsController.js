require('dotenv-flow/config');
const pool = require('../config/database');
const { sendPromotionalSms, normalizeMobile, maskMobile } = require('../services/smsService');

const BATCH_SIZE = 50;
const CONCURRENT_BATCHES = 3;

const getCampaigns = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, o.offer_type, o.title as offer_title, o.discount_value, o.discount_type
       FROM sms_campaigns c
       LEFT JOIN offers o ON c.offer_id = o.id
       ORDER BY c.created_at DESC
       LIMIT 50`
    );
    res.json({ campaigns: result.rows });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaignResult = await pool.query(
      `SELECT c.*, o.offer_type, o.title as offer_title, o.discount_value, o.discount_type
       FROM sms_campaigns c
       LEFT JOIN offers o ON c.offer_id = o.id
       WHERE c.id = $1`,
      [id]
    );

    if (campaignResult.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const recipientsResult = await pool.query(
      `SELECT id, customer_id, mobile, provider_message_id, status, error_message, sent_at, delivered_at
       FROM sms_campaign_recipients
       WHERE campaign_id = $1
       ORDER BY created_at DESC
       LIMIT 100`,
      [id]
    );

    const statsResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM sms_campaign_recipients
       WHERE campaign_id = $1
       GROUP BY status`,
      [id]
    );

    const stats = {};
    statsResult.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    res.json({
      campaign: campaignResult.rows[0],
      recipients: recipientsResult.rows,
      stats
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
};

const createCampaign = async (req, res) => {
  const { name, offer_id, message, template_id, sender_id } = req.body;

  if (!name || !message) {
    return res.status(400).json({ error: 'Campaign name and message are required' });
  }

  if (offer_id) {
    const offerResult = await pool.query('SELECT id FROM offers WHERE id = $1', [offer_id]);
    if (offerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid offer ID' });
    }
  }

  try {
    const result = await pool.query(
      `INSERT INTO sms_campaigns (name, offer_id, message, template_id, sender_id, status, created_by)
       VALUES ($1, $2, $3, $4, $5, 'DRAFT', $6)
       RETURNING *`,
      [name, offer_id || null, message, template_id || null, sender_id || null, req.user.id]
    );

    res.status(201).json({ campaign: result.rows[0] });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
};

const getRecipients = async (req, res) => {
  const { offer_id, selection_type } = req.query;

  try {
    let query = '';
    let params = [];

    if (selection_type === 'all') {
      query = `
        SELECT id, full_name, mobile_number
        FROM users
        WHERE role = 'CUSTOMER'
          AND mobile_number IS NOT NULL
          AND mobile_number != ''
      `;
    } else if (selection_type === 'offer_eligible' && offer_id) {
      query = `
        SELECT DISTINCT u.id, u.full_name, u.mobile_number
        FROM users u
        WHERE u.role = 'CUSTOMER'
          AND u.mobile_number IS NOT NULL
          AND u.mobile_number != ''
      `;
      params = [offer_id];
    } else {
      return res.status(400).json({ error: 'Invalid selection type' });
    }

    const result = await pool.query(query, params);

    const recipients = result.rows
      .filter(row => normalizeMobile(row.mobile_number))
      .map(row => ({
        customer_id: row.id,
        mobile: normalizeMobile(row.mobile_number),
        name: row.full_name
      }));

    const uniqueMobiles = new Set();
    const uniqueRecipients = [];
    for (const r of recipients) {
      if (!uniqueMobiles.has(r.mobile)) {
        uniqueMobiles.add(r.mobile);
        uniqueRecipients.push(r);
      }
    }

    res.json({ recipients: uniqueRecipients, count: uniqueRecipients.length });
  } catch (error) {
    console.error('Get recipients error:', error);
    res.status(500).json({ error: 'Failed to fetch recipients' });
  }
};

const sendCampaign = async (req, res) => {
  const { id } = req.params;
  const { recipients, custom_message } = req.body;

  if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
    return res.status(400).json({ error: 'Recipients are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const campaignResult = await client.query(
      'SELECT * FROM sms_campaigns WHERE id = $1 FOR UPDATE',
      [id]
    );

    if (campaignResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const campaign = campaignResult.rows[0];

    if (campaign.status !== 'DRAFT') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Campaign has already been sent' });
    }

    await client.query(
      'UPDATE sms_campaigns SET status = $1, total_recipients = $2, updated_at = $3 WHERE id = $4',
      ['SENDING', recipients.length, new Date(), id]
    );

    const recipientInserts = recipients.map(r => [
      id,
      r.customer_id || null,
      r.mobile,
      'PENDING'
    ]);

    for (const [cid, customerId, mobile, status] of recipientInserts) {
      await client.query(
        `INSERT INTO sms_campaign_recipients (campaign_id, customer_id, mobile, status)
         VALUES ($1, $2, $3, $4)`,
        [cid, customerId, mobile, status]
      );
    }

    await client.query('COMMIT');

    processCampaignSend(id, campaign, recipients, custom_message).catch(err => {
      console.error('Campaign send error:', err);
    });

    res.json({ message: 'Campaign sending started', campaign_id: id });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Send campaign error:', error);
    res.status(500).json({ error: 'Failed to start campaign send' });
  } finally {
    client.release();
  }
};

async function processCampaignSend(campaignId, campaign, recipients, customMessage) {
  const client = await pool.connect();
  try {
    let sentCount = 0;
    let failedCount = 0;

    const batches = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      await Promise.all(
        batch.map(async (recipient) => {
          try {
            const message = replacePlaceholders(
              customMessage || campaign.message,
              recipient,
              campaign
            );

            const result = await sendPromotionalSms({
              mobile: recipient.mobile,
              message,
              templateId: campaign.template_id
            });

            if (result.success) {
              await client.query(
                `UPDATE sms_campaign_recipients
                 SET provider_message_id = $1, status = 'SENT', sent_at = $2, updated_at = $3
                 WHERE campaign_id = $4 AND mobile = $5`,
                [result.providerMessageId, new Date(), new Date(), campaignId, recipient.mobile]
              );
              sentCount++;
            } else {
              await client.query(
                `UPDATE sms_campaign_recipients
                 SET status = 'FAILED', error_message = $1, updated_at = $2
                 WHERE campaign_id = $3 AND mobile = $4`,
                [result.error, new Date(), campaignId, recipient.mobile]
              );
              failedCount++;
            }
          } catch (err) {
            await client.query(
              `UPDATE sms_campaign_recipients
               SET status = 'FAILED', error_message = $1, updated_at = $2
               WHERE campaign_id = $3 AND mobile = $4`,
              [err.message, new Date(), campaignId, recipient.mobile]
            );
            failedCount++;
          }
        })
      );

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    let finalStatus = 'COMPLETED';
    if (failedCount > 0 && sentCount > 0) {
      finalStatus = 'PARTIALLY_FAILED';
    } else if (failedCount > 0 && sentCount === 0) {
      finalStatus = 'FAILED';
    }

    await client.query(
      `UPDATE sms_campaigns
       SET status = $1, sent_count = $2, failed_count = $3, updated_at = $4
       WHERE id = $5`,
      [finalStatus, sentCount, failedCount, new Date(), campaignId]
    );

    console.log(`Campaign ${campaignId} completed: sent=${sentCount}, failed=${failedCount}, status=${finalStatus}`);
  } catch (error) {
    console.error('Process campaign send error:', error);
    await client.query(
      `UPDATE sms_campaigns SET status = 'FAILED', updated_at = $1 WHERE id = $2`,
      [new Date(), campaignId]
    );
  } finally {
    client.release();
  }
}

function replacePlaceholders(message, recipient, campaign) {
  let result = message;
  result = result.replace(/\{\{customer_name\}\}/g, recipient.name || 'Customer');
  result = result.replace(/\{\{mobile\}\}/g, recipient.mobile || '');
  result = result.replace(/\{\{offer_title\}\}/g, campaign.offer_title || '');
  result = result.replace(/\{\{discount\}\}/g, campaign.discount_value ? `₹${campaign.discount_value}` : '');
  result = result.replace(/\{\{coupon_code\}\}/g, campaign.offer_type || '');
  result = result.replace(/\{\{shop_url\}\}/g, process.env.FRONTEND_URL || 'https://www.srrfashions.in');
  return result;
}

const sendTestSms = async (req, res) => {
  const { mobile, message, template_id } = req.body;

  if (!mobile || !message) {
    return res.status(400).json({ error: 'Mobile number and message are required' });
  }

  const normalized = normalizeMobile(mobile);
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid mobile number' });
  }

  try {
    const result = await sendPromotionalSms({
      mobile: normalized,
      message,
      templateId: template_id || null
    });

    if (result.success) {
      res.json({
        message: 'Test SMS sent successfully',
        providerMessageId: result.providerMessageId,
        mobile: maskMobile(normalized)
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Send test SMS error:', error);
    res.status(500).json({ error: 'Failed to send test SMS' });
  }
};

const webhookDelivery = async (req, res) => {
  try {
    const { messageId, status, deliveredAt } = req.body;

    if (!messageId || !status) {
      return res.status(400).json({ error: 'Message ID and status are required' });
    }

    const updateFields = ['status = $1', 'updated_at = $2'];
    const values = [status, new Date()];
    let paramCount = 3;

    if (deliveredAt) {
      updateFields.push(`delivered_at = $${paramCount++}`);
      values.push(new Date(deliveredAt));
    }

    values.push(messageId);

    const result = await pool.query(
      `UPDATE sms_campaign_recipients
       SET ${updateFields.join(', ')}
       WHERE provider_message_id = $${paramCount}
       RETURNING id`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    res.json({ message: 'Delivery status updated' });
  } catch (error) {
    console.error('Webhook delivery error:', error);
    res.status(500).json({ error: 'Failed to update delivery status' });
  }
};

module.exports = {
  getCampaigns,
  getCampaignById,
  createCampaign,
  getRecipients,
  sendCampaign,
  sendTestSms,
  webhookDelivery
};
