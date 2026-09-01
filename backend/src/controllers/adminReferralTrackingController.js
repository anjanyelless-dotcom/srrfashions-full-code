require('dotenv-flow/config');
const pool = require('../config/database');

const getAllReferrals = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        r.id,
        r.referrer_user_id,
        referrer.full_name as referrer_name,
        referrer.email as referrer_email,
        referrer.referral_code,
        r.referred_user_id,
        referred.full_name as referred_user_name,
        referred.email as referred_user_email,
        referred.mobile_number as referred_user_mobile,
        r.status,
        r.created_at as registration_date,
        r.updated_at
       FROM referrals r
       JOIN users referrer ON r.referrer_user_id = referrer.id
       JOIN users referred ON r.referred_user_id = referred.id
       ORDER BY r.created_at DESC`
    );

    res.json({ referrals: result.rows });
  } catch (error) {
    console.error('Get all referrals error:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
};

const disableReferral = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if referral exists
    const referralExists = await pool.query(
      'SELECT id FROM referrals WHERE id = $1',
      [id]
    );

    if (referralExists.rows.length === 0) {
      return res.status(404).json({ error: 'Referral not found' });
    }

    // Set status to DISABLED
    await pool.query(
      `UPDATE referrals
       SET status = 'DISABLED', updated_at = $1
       WHERE id = $2`,
      [new Date(), id]
    );

    res.json({ message: 'Referral disabled successfully' });
  } catch (error) {
    console.error('Disable referral error:', error);
    res.status(500).json({ error: 'Failed to disable referral' });
  }
};

const approveReward = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if reward exists
    const rewardExists = await pool.query(
      'SELECT id FROM referral_rewards WHERE id = $1',
      [id]
    );

    if (rewardExists.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    // Approve reward (update is_approved to true)
    await pool.query(
      `UPDATE referral_rewards
       SET is_approved = true
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Reward approved successfully' });
  } catch (error) {
    console.error('Approve reward error:', error);
    res.status(500).json({ error: 'Failed to approve reward' });
  }
};

const rejectReward = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if reward exists
    const rewardExists = await pool.query(
      'SELECT id FROM referral_rewards WHERE id = $1',
      [id]
    );

    if (rewardExists.rows.length === 0) {
      return res.status(404).json({ error: 'Reward not found' });
    }

    // Reject reward (update is_approved to false)
    await pool.query(
      `UPDATE referral_rewards
       SET is_approved = false
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Reward rejected successfully' });
  } catch (error) {
    console.error('Reject reward error:', error);
    res.status(500).json({ error: 'Failed to reject reward' });
  }
};

// Helper function to be called when order is confirmed
const qualifyReferral = async (userId, orderId, orderTotal) => {
  try {
    // Get referral settings
    const settingsResult = await pool.query(
      'SELECT * FROM referral_settings ORDER BY updated_at DESC LIMIT 1'
    );

    const settings = settingsResult.rows[0];

    if (!settings || !settings.is_enabled) {
      return { success: false, message: 'Referral program not enabled' };
    }

    // Check if this user was referred
    const referralResult = await pool.query(
      `SELECT id, referrer_user_id, status
       FROM referrals
       WHERE referred_user_id = $1`,
      [userId]
    );

    if (referralResult.rows.length === 0) {
      return { success: false, message: 'User was not referred' };
    }

    const referral = referralResult.rows[0];

    if (referral.status !== 'REGISTERED') {
      return { success: false, message: 'Referral already processed' };
    }

    // Check minimum order requirement
    if (settings.minimum_order && orderTotal < parseFloat(settings.minimum_order)) {
      return {
        success: false,
        message: 'Order does not meet minimum order requirement',
        minimum_order: settings.minimum_order
      };
    }

    // Update referral status to QUALIFIED
    await pool.query(
      `UPDATE referrals
       SET status = 'QUALIFIED',
           updated_at = $1
       WHERE id = $2`,
      [new Date(), referral.id]
    );

    // Create reward for referrer
    const rewardAmount = settings.referrer_reward_value;

    const rewardResult = await pool.query(
      `INSERT INTO referral_rewards (referral_id, user_id, reward_amount, is_approved)
       VALUES ($1, $2, $3, true)
       RETURNING *`,
      [referral.id, referral.referrer_user_id, rewardAmount]
    );

    // Update referral status to REWARD_AVAILABLE
    await pool.query(
      `UPDATE referrals
       SET status = 'REWARD_AVAILABLE',
           updated_at = $1
       WHERE id = $2`,
      [new Date(), referral.id]
    );

    return {
      success: true,
      message: 'Referral qualified and reward created',
      reward: rewardResult.rows[0],
      referral_id: referral.id
    };
  } catch (error) {
    console.error('Qualify referral error:', error);
    return { success: false, message: 'Failed to qualify referral', error: error.message };
  }
};

module.exports = {
  getAllReferrals,
  disableReferral,
  approveReward,
  rejectReward,
  qualifyReferral
};