require('dotenv-flow/config');
const pool = require('../config/database');

const getActiveOffers = async (req, res) => {
  try {
    const now = new Date();

    const result = await pool.query(
      `SELECT id,
              title,
              description,
              offer_type,
              discount_type,
              discount_value,
              minimum_order_value,
              maximum_discount,
              coupon_code,
              is_active,
              start_date,
              end_date,
              usage_limit,
              per_user_limit,
              created_at,
              updated_at
       FROM offers
       WHERE is_active = true
         AND (start_date IS NULL OR start_date <= $1)
         AND (end_date IS NULL OR end_date >= $1)
       ORDER BY created_at DESC`,
      [now]
    );

    const offers = result.rows.map((offer) => ({
      id: offer.id,
      title: offer.title,
      description: offer.description,
      offerType: offer.offer_type,
      discountType: offer.discount_type,
      discountValue: parseFloat(offer.discount_value),
      minimumOrderValue: offer.minimum_order_value ? parseFloat(offer.minimum_order_value) : null,
      maximumDiscount: offer.maximum_discount ? parseFloat(offer.maximum_discount) : null,
      couponCode: offer.coupon_code,
      isActive: offer.is_active,
      startDate: offer.start_date,
      endDate: offer.end_date,
      usageLimit: offer.usage_limit,
      perUserLimit: offer.per_user_limit,
      createdAt: offer.created_at,
      updatedAt: offer.updated_at
    }));

    res.json({ success: true, offers });
  } catch (error) {
    console.error('Get active offers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active offers' });
  }
};

const hasCompletedOrder = async (userId, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*) as count
     FROM orders o
     JOIN payments p ON o.id = p.order_id
     WHERE o.user_id = $1
       AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
       AND p.payment_status IN ('PAID', 'APPROVED')`,
    [userId]
  );

  return parseInt(result.rows[0].count) > 0;
};

const getActiveOfferByType = async (offerType, client = pool) => {
  const now = new Date();

  const result = await client.query(
    `SELECT *
     FROM offers
     WHERE offer_type = $1
       AND is_active = true
       AND (start_date IS NULL OR start_date <= $2)
       AND (end_date IS NULL OR end_date >= $2)`,
    [offerType, now]
  );

  return result.rows[0] || null;
};

const calculateOfferDiscount = (offer, subtotal) => {
  let discount = 0;
  const amount = parseFloat(subtotal);
  const discountValue = parseFloat(offer.discount_value);

  if (offer.discount_type === 'FIXED') {
    discount = discountValue;
  } else if (offer.discount_type === 'PERCENTAGE') {
    discount = (amount * discountValue) / 100;
  }

  if (offer.maximum_discount !== null && offer.maximum_discount !== undefined) {
    discount = Math.min(discount, parseFloat(offer.maximum_discount));
  }

  if (discount > amount) {
    discount = amount;
  }

  return parseFloat(discount.toFixed(2));
};

const hasUsedNextOrderOffer = async (userId, nextOrderOfferId, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*) as count
     FROM orders o
     JOIN payments p ON o.id = p.order_id
     WHERE o.user_id = $1
       AND o.offer_id = $2
       AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
       AND p.payment_status IN ('PAID', 'APPROVED')`,
    [userId, nextOrderOfferId]
  );

  return parseInt(result.rows[0].count) > 0;
};

const BIRTHDAY_WINDOW_MONTHS = 1;

const isInBirthdayWindow = (dateOfBirth) => {
  if (!dateOfBirth) return false;
  const now = new Date();
  const dob = new Date(dateOfBirth);
  // Compare using local calendar components so the stored date does not shift across timezones
  return now.getMonth() === dob.getMonth();
};

const hasUsedBirthdayOfferThisYear = async (userId, birthdayOfferId, client = pool) => {
  const result = await client.query(
    `SELECT COUNT(*) as count
     FROM orders o
     JOIN payments p ON o.id = p.order_id
     WHERE o.user_id = $1
       AND o.offer_id = $2
       AND EXTRACT(YEAR FROM o.created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
       AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
       AND p.payment_status IN ('PAID', 'APPROVED')`,
    [userId, birthdayOfferId]
  );

  return parseInt(result.rows[0].count) > 0;
};

const getOfferDiscount = async (offerType, userId, subtotal, client = pool) => {
  try {
    const offer = await getActiveOfferByType(offerType, client);

    if (!offer) {
      return { error: `${offerType} offer is not available` };
    }

    const completedOrder = await hasCompletedOrder(userId, client);

    if ((offerType === 'FIRST_ORDER' || offerType === 'REFERRAL') && completedOrder) {
      return { error: 'This offer is only for new customers' };
    }

    if (offerType === 'REFERRAL') {
      const referral = await client.query(
        `SELECT id, status
         FROM referrals
         WHERE referred_user_id = $1
           AND status IN ('PENDING', 'REGISTERED')`,
        [userId]
      );

      if (referral.rows.length === 0) {
        return { error: 'No active referral found for this user' };
      }
    }

    if (offerType === 'NEXT_ORDER') {
      if (!completedOrder) {
        return { error: 'You must complete a successful order before using the next order offer' };
      }

      const used = await hasUsedNextOrderOffer(userId, offer.id, client);

      if (used) {
        return { error: 'You have already used the next order offer' };
      }
    }

    if (offerType === 'BIRTHDAY') {
      const user = await client.query(
        'SELECT date_of_birth FROM users WHERE id = $1',
        [userId]
      );

      const dateOfBirth = user.rows[0]?.date_of_birth;

      if (!dateOfBirth) {
        return { error: 'Birthday information is required' };
      }

      if (!isInBirthdayWindow(dateOfBirth)) {
        return { error: 'Birthday offer is not currently available' };
      }

      const used = await hasUsedBirthdayOfferThisYear(userId, offer.id, client);

      if (used) {
        return { error: 'Birthday offer already used this year' };
      }
    }

    // Generic usage limit checks (primarily used for SPECIAL, but applied to any offer with limits)
    if (offer.usage_limit !== null && offer.usage_limit !== undefined) {
      const globalUsage = await client.query(
        `SELECT COUNT(*) as count
         FROM orders o
         JOIN payments p ON o.id = p.order_id
         WHERE o.offer_id = $1
           AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
           AND p.payment_status IN ('PAID', 'APPROVED')`,
        [offer.id]
      );

      if (parseInt(globalUsage.rows[0].count) >= parseInt(offer.usage_limit)) {
        return { error: 'Offer usage limit has been reached' };
      }
    }

    if (offer.per_user_limit !== null && offer.per_user_limit !== undefined) {
      const userUsage = await client.query(
        `SELECT COUNT(*) as count
         FROM orders o
         JOIN payments p ON o.id = p.order_id
         WHERE o.user_id = $1
           AND o.offer_id = $2
           AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
           AND p.payment_status IN ('PAID', 'APPROVED')`,
        [userId, offer.id]
      );

      if (parseInt(userUsage.rows[0].count) >= parseInt(offer.per_user_limit)) {
        return { error: 'Offer per-user limit has been reached' };
      }
    }

    const minimumOrderValue = parseFloat(offer.minimum_order_value || 0);

    if (parseFloat(subtotal) < minimumOrderValue) {
      return {
        error: 'Offer is not applicable to this order.',
        minimum_order_value: minimumOrderValue
      };
    }

    const discount = calculateOfferDiscount(offer, subtotal);

    return { offer, discount };
  } catch (error) {
    console.error('Get offer discount error:', error);
    return { error: 'Failed to calculate offer discount' };
  }
};

const getOffersEligibility = async (req, res) => {
  const userId = req.user.id;

  try {
    const completedOrder = await hasCompletedOrder(userId);
    const eligibility = {};

    const firstOrderOffer = await getActiveOfferByType('FIRST_ORDER');
    if (!firstOrderOffer) {
      eligibility.FIRST_ORDER = { eligible: false, reason: 'Offer not available' };
    } else if (completedOrder) {
      eligibility.FIRST_ORDER = { eligible: false, reason: 'First order already completed' };
    } else {
      eligibility.FIRST_ORDER = { eligible: true, discountValue: parseFloat(firstOrderOffer.discount_value) };
    }

    const referralOffer = await getActiveOfferByType('REFERRAL');
    if (!referralOffer) {
      eligibility.REFERRAL = { eligible: false, reason: 'Offer not available' };
    } else if (completedOrder) {
      eligibility.REFERRAL = { eligible: false, reason: 'First order already completed' };
    } else {
      const referral = await pool.query(
        `SELECT id, status
         FROM referrals
         WHERE referred_user_id = $1
           AND status IN ('PENDING', 'REGISTERED')`,
        [userId]
      );

      if (referral.rows.length === 0) {
        eligibility.REFERRAL = { eligible: false, reason: 'No active referral found' };
      } else {
        eligibility.REFERRAL = { eligible: true, discountValue: parseFloat(referralOffer.discount_value) };
      }
    }

    const nextOrderOffer = await getActiveOfferByType('NEXT_ORDER');
    if (!nextOrderOffer) {
      eligibility.NEXT_ORDER = { eligible: false, reason: 'Offer not available' };
    } else if (!completedOrder) {
      eligibility.NEXT_ORDER = { eligible: false, reason: 'No completed order yet' };
    } else {
      const usedNextOrder = await hasUsedNextOrderOffer(userId, nextOrderOffer.id);

      if (usedNextOrder) {
        eligibility.NEXT_ORDER = { eligible: false, reason: 'Already used' };
      } else {
        eligibility.NEXT_ORDER = { eligible: true, discountValue: parseFloat(nextOrderOffer.discount_value) };
      }
    }

    const birthdayOffer = await getActiveOfferByType('BIRTHDAY');
    if (!birthdayOffer) {
      eligibility.BIRTHDAY = { eligible: false, reason: 'Offer not available' };
    } else {
      const user = await pool.query(
        'SELECT date_of_birth FROM users WHERE id = $1',
        [userId]
      );

      const dateOfBirth = user.rows[0]?.date_of_birth;

      if (!dateOfBirth) {
        eligibility.BIRTHDAY = { eligible: false, reason: 'Birthday information is required' };
      } else if (!isInBirthdayWindow(dateOfBirth)) {
        eligibility.BIRTHDAY = { eligible: false, reason: 'Birthday offer is not currently available' };
      } else {
        const used = await hasUsedBirthdayOfferThisYear(userId, birthdayOffer.id);

        if (used) {
          eligibility.BIRTHDAY = { eligible: false, reason: 'Birthday offer already used this year' };
        } else {
          eligibility.BIRTHDAY = { eligible: true, discountValue: parseFloat(birthdayOffer.discount_value) };
        }
      }
    }

    const specialOffer = await getActiveOfferByType('SPECIAL');
    if (!specialOffer) {
      eligibility.SPECIAL = { eligible: false, reason: 'Special offer is not currently available' };
    } else {
      const specialGlobalUsage = await pool.query(
        `SELECT COUNT(*) as count
         FROM orders o
         JOIN payments p ON o.id = p.order_id
         WHERE o.offer_id = $1
           AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
           AND p.payment_status IN ('PAID', 'APPROVED')`,
        [specialOffer.id]
      );
      const specialUserUsage = await pool.query(
        `SELECT COUNT(*) as count
         FROM orders o
         JOIN payments p ON o.id = p.order_id
         WHERE o.user_id = $1
           AND o.offer_id = $2
           AND o.order_status NOT IN ('PENDING', 'PAYMENT_VERIFICATION_PENDING', 'CANCELLED', 'REJECTED')
           AND p.payment_status IN ('PAID', 'APPROVED')`,
        [userId, specialOffer.id]
      );

      if (specialOffer.usage_limit !== null && specialOffer.usage_limit !== undefined &&
          parseInt(specialGlobalUsage.rows[0].count) >= parseInt(specialOffer.usage_limit)) {
        eligibility.SPECIAL = { eligible: false, reason: 'Offer usage limit has been reached' };
      } else if (specialOffer.per_user_limit !== null && specialOffer.per_user_limit !== undefined &&
                 parseInt(specialUserUsage.rows[0].count) >= parseInt(specialOffer.per_user_limit)) {
        eligibility.SPECIAL = { eligible: false, reason: 'Offer per-user limit has been reached' };
      } else {
        eligibility.SPECIAL = { eligible: true, discountValue: parseFloat(specialOffer.discount_value) };
      }
    }

    res.json({ success: true, eligibility });
  } catch (error) {
    console.error('Get offers eligibility error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch offer eligibility' });
  }
};

const applyOffer = async (req, res) => {
  const userId = req.user.id;
  const { offer_type, subtotal } = req.body;

  if (!offer_type || !['FIRST_ORDER', 'REFERRAL', 'NEXT_ORDER', 'BIRTHDAY', 'SPECIAL'].includes(offer_type)) {
    return res.status(400).json({ success: false, error: 'Valid offer_type is required (FIRST_ORDER, REFERRAL, NEXT_ORDER, BIRTHDAY, or SPECIAL)' });
  }

  if (subtotal === undefined || subtotal === null || isNaN(parseFloat(subtotal))) {
    return res.status(400).json({ success: false, error: 'Valid subtotal is required' });
  }

  const amount = parseFloat(subtotal);

  if (amount <= 0) {
    return res.status(400).json({ success: false, error: 'Subtotal must be greater than zero' });
  }

  const result = await getOfferDiscount(offer_type, userId, amount);

  if (result.error) {
    return res.status(400).json({
      success: false,
      error: result.error,
      details: result.minimum_order_value ? { minimum_order_value: result.minimum_order_value } : undefined
    });
  }

  const finalAmount = parseFloat((amount - result.discount).toFixed(2));

  res.json({
    success: true,
    offer: {
      type: result.offer.offer_type,
      title: result.offer.title
    },
    discount: result.discount,
    finalAmount
  });
};

const completeReferralOffer = async (referredUserId, offerId) => {
  if (!offerId) {
    return { success: false, message: 'No offer used on this order' };
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const offer = await client.query(
      `SELECT id, offer_type, discount_value
       FROM offers
       WHERE id = $1 AND is_active = true`,
      [offerId]
    );

    if (offer.rows.length === 0 || offer.rows[0].offer_type !== 'REFERRAL') {
      await client.query('ROLLBACK');
      client.release();
      return { success: false, message: 'Not a referral offer' };
    }

    const referral = await client.query(
      `SELECT id, referrer_user_id, status
       FROM referrals
       WHERE referred_user_id = $1
       FOR UPDATE`,
      [referredUserId]
    );

    if (referral.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return { success: false, message: 'User was not referred' };
    }

    const currentStatus = referral.rows[0].status;

    if (currentStatus !== 'REGISTERED' && currentStatus !== 'PENDING') {
      await client.query('ROLLBACK');
      client.release();
      return { success: false, message: 'Referral already processed' };
    }

    const referralId = referral.rows[0].id;
    const referrerId = referral.rows[0].referrer_user_id;
    const rewardAmount = parseFloat(offer.rows[0].discount_value);

    await client.query(
      `INSERT INTO referral_rewards (referral_id, user_id, reward_amount, is_used, is_approved, order_id_used_on)
       VALUES ($1, $2, $3, false, true, null)`,
      [referralId, referrerId, rewardAmount]
    );

    await client.query(
      `UPDATE referrals
       SET status = 'REWARD_AVAILABLE', updated_at = NOW()
       WHERE id = $1`,
      [referralId]
    );

    await client.query('COMMIT');
    client.release();

    return { success: true, reward_amount: rewardAmount };
  } catch (error) {
    await client.query('ROLLBACK');
    client.release();
    console.error('Complete referral offer error:', error);
    return { success: false, message: 'Failed to complete referral offer' };
  }
};

module.exports = {
  getActiveOffers,
  getOffersEligibility,
  applyOffer,
  getOfferDiscount,
  hasCompletedOrder,
  completeReferralOffer
};
