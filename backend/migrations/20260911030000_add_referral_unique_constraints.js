exports.up = (pgm) => {
  pgm.addConstraint('referrals', 'referrals_referred_user_id_unique', {
    unique: ['referred_user_id']
  });
  pgm.addConstraint('referrals', 'referrals_referrer_referred_unique', {
    unique: ['referrer_user_id', 'referred_user_id']
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('referrals', 'referrals_referrer_referred_unique');
  pgm.dropConstraint('referrals', 'referrals_referred_user_id_unique');
};
