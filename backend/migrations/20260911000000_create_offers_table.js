exports.up = (pgm) => {
  pgm.createTable('offers', {
    id: 'id',
    title: { type: 'varchar(255)', notNull: true },
    description: { type: 'varchar(500)' },
    offer_type: { type: 'varchar(50)', notNull: true, check: "offer_type IN ('FIRST_ORDER','REFERRAL','NEXT_ORDER','SPECIAL','BIRTHDAY')" },
    discount_type: { type: 'varchar(20)', notNull: true, check: "discount_type IN ('FIXED','PERCENTAGE')" },
    discount_value: { type: 'decimal(10,2)', notNull: true },
    minimum_order_value: { type: 'decimal(10,2)', default: 0 },
    maximum_discount: { type: 'decimal(10,2)' },
    coupon_code: { type: 'varchar(50)' },
    is_active: { type: 'boolean', notNull: true, default: true },
    start_date: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    end_date: { type: 'timestamp' },
    usage_limit: { type: 'integer' },
    per_user_limit: { type: 'integer' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('offers', 'offer_type');
  pgm.createIndex('offers', 'is_active');
};

exports.down = (pgm) => {
  pgm.dropTable('offers');
};
