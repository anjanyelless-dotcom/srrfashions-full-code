require('dotenv-flow/config');
const pool = require('../config/database');

const getMyReferrals = async (req, res) => {
  const userId = req.user.id;

  try {
    const user = await pool.query(
      'SELECT id, referral_code FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const referralCode = user.rows[0].referral_code;

    const referralOffer = await pool.query(
      `SELECT discount_value
       FROM offers
       WHERE offer_type = 'REFERRAL' AND is_active = true
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())`,
      []
    );

    const reward = referralOffer.rows.length > 0
      ? parseFloat(referralOffer.rows[0].discount_value)
      : 50;

    const referrals = await pool.query(
      `SELECT
        r.id,
        r.referred_user_id,
        u.full_name as referred_user_name,
        r.status,
        r.created_at,
        r.updated_at
       FROM referrals r
       JOIN users u ON r.referred_user_id = u.id
       WHERE r.referrer_user_id = $1
       ORDER BY r.created_at DESC`,
      [userId]
    );

    const totalReferrals = referrals.rows.length;
    const pendingReferrals = referrals.rows.filter(r =>
      r.status === 'PENDING' || r.status === 'REGISTERED'
    ).length;
    const completedReferrals = referrals.rows.filter(r =>
      r.status === 'REWARD_AVAILABLE' || r.status === 'REWARD_USED' || r.status === 'QUALIFIED'
    ).length;

    const rewards = await pool.query(
      `SELECT
        rr.id,
        rr.referral_id,
        rr.reward_amount,
        rr.is_approved,
        rr.is_used
       FROM referral_rewards rr
       JOIN referrals r ON rr.referral_id = r.id
       WHERE r.referrer_user_id = $1`,
      [userId]
    );

    const totalRewardsEarned = rewards.rows
      .filter(r => r.is_approved)
      .reduce((sum, r) => sum + parseFloat(r.reward_amount), 0);

    const baseUrl = process.env.FRONTEND_URL || 'https://www.srrfashions.in';
    const referralLink = `${baseUrl}/?ref=${referralCode}`;

    res.json({
      success: true,
      referralCode,
      referralLink,
      reward,
      totalReferrals,
      pendingReferrals,
      completedReferrals,
      totalRewardsEarned,
      referrals: referrals.rows,
      rewards: rewards.rows
    });
  } catch (error) {
    console.error('Get my referrals error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch referral information' });
  }
};

module.exports = { getMyReferrals };
