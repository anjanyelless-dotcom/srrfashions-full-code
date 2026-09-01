require('dotenv-flow/config');
const pool = require('../config/database');

const getReferralInfo = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's referral code
    const user = await pool.query(
      'SELECT referral_code FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const referralCode = user.rows[0].referral_code;

    // Get current referral settings
    const settingsResult = await pool.query(
      'SELECT * FROM referral_settings ORDER BY updated_at DESC LIMIT 1'
    );

    const referralSettings = settingsResult.rows[0] || null;

    // Get referral status list (people this user has referred)
    const referralsResult = await pool.query(
      `SELECT
        r.id,
        r.referred_user_id,
        u.full_name as referred_user_name,
        u.email as referred_user_email,
        u.mobile_number as referred_user_mobile,
        r.status,
        r.created_at as registration_date,
        r.updated_at
       FROM referrals r
       JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    // Get rewards for this user
    const rewardsResult = await pool.query(
      `SELECT
        rr.id,
        rr.referral_id,
        rr.reward_amount,
        rr.is_used,
        rr.is_approved,
        rr.order_id_used_on,
        rr.created_at as reward_created_at,
        u.full_name as referred_user_name
       FROM referral_rewards rr
       JOIN referrals r ON rr.referral_id = r.id
       JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_user_id = $1
       ORDER BY rr.created_at DESC`,
      [userId]
    );

    // Calculate statistics
    const totalReferrals = referralsResult.rows.length;
    const qualifiedReferrals = referralsResult.rows.filter(r => r.status === 'QUALIFIED').length;
    const completedReferrals = referralsResult.rows.filter(r => r.status === 'REWARD_AVAILABLE' || r.status === 'REWARD_USED').length;
    const usedRewards = rewardsResult.rows.filter(r => r.is_used).length;

    // Build share link (you can customize this based on your frontend URL)
    const shareLink = `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/register?ref=${referralCode}`;

    res.json({
      referral_code: referralCode,
      share_link: shareLink,
      referral_settings: referralSettings ? {
        is_enabled: referralSettings.is_enabled,
        reward_type: referralSettings.reward_type,
        referrer_reward_value: referralSettings.referrer_reward_value,
        minimum_order: referralSettings.minimum_order
      } : null,
      statistics: {
        total_referrals: totalReferrals,
        qualified_referrals: qualifiedReferrals,
        completed_referrals: completedReferrals
      },
      referrals: referralsResult.rows,
      rewards: rewardsResult.rows
    });
  } catch (error) {
    console.error('Get referral info error:', error);
    res.status(500).json({ error: 'Failed to fetch referral information' });
  }
};

const getReferralByCode = async (req, ref) => {
  const { code } = ref.params;

  try {
    // Get referral settings to check if referrals are enabled
    const settingsResult = await pool.query(
      'SELECT is_enabled FROM referral_settings ORDER BY updated_at DESC LIMIT 1'
    );

    const settings = settingsResult.rows[0];

    if (!settings || !settings.is_enabled) {
      return null;
    }

    // Check if referral code exists and is valid
    const result = await pool.query(
      `SELECT
        u.id as user_id,
        u.full_name,
        u.referral_code,
        rs.reward_type,
        rs.new_customer_reward_value,
        rs.minimum_order
       FROM users u
       CROSS JOIN LATERAL (
         SELECT * FROM referral_settings ORDER BY updated_at DESC LIMIT 1
       ) rs
       WHERE u.referral_code = $1 AND u.role = 'CUSTOMER'`,
      [code]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    console.error('Get referral by code error:', error);
    return null;
  }
};

module.exports = {
  getReferralInfo,
  getReferralByCode
};