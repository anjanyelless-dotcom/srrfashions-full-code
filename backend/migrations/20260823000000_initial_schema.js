exports.up = (pgm) => {
  // users table
  pgm.createTable('users', {
    id: 'id',
    full_name: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    mobile_number: { type: 'varchar(20)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    role: { type: 'varchar(20)', notNull: true, check: "role IN ('CUSTOMER', 'ADMIN')" },
    referral_code: { type: 'varchar(50)', unique: true },
    referred_by_user_id: { type: 'integer', references: 'users(id)', onDelete: 'SET NULL' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // addresses table
  pgm.createTable('addresses', {
    id: 'id',
    user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    name: { type: 'varchar(255)', notNull: true },
    mobile_number: { type: 'varchar(20)', notNull: true },
    house_flat: { type: 'varchar(255)', notNull: true },
    street_area: { type: 'varchar(255)', notNull: true },
    city: { type: 'varchar(100)', notNull: true },
    state: { type: 'varchar(100)', notNull: true },
    pincode: { type: 'varchar(20)', notNull: true },
    landmark: { type: 'varchar(255)' },
    is_default: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // categories table
  pgm.createTable('categories', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    parent_id: { type: 'integer', references: 'categories(id)', onDelete: 'SET NULL' },
    image_url: { type: 'varchar(500)' },
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // products table
  pgm.createTable('products', {
    id: 'id',
    name: { type: 'varchar(255)', notNull: true },
    description: { type: 'text' },
    category_id: { type: 'integer', notNull: true, references: 'categories(id)', onDelete: 'RESTRICT' },
    regular_price: { type: 'decimal(10,2)', notNull: true },
    selling_price: { type: 'decimal(10,2)', notNull: true },
    discount: { type: 'decimal(10,2)', notNull: true, default: 0 },
    video_url: { type: 'varchar(500)' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // product_images table
  pgm.createTable('product_images', {
    id: 'id',
    product_id: { type: 'integer', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    image_url: { type: 'varchar(500)', notNull: true },
    display_order: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // product_variants table
  pgm.createTable('product_variants', {
    id: 'id',
    product_id: { type: 'integer', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    color: { type: 'varchar(50)', notNull: true },
    size: { type: 'varchar(50)', notNull: true },
    sku: { type: 'varchar(100)', notNull: true },
    stock_quantity: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // carts table
  pgm.createTable('carts', {
    id: 'id',
    user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // cart_items table
  pgm.createTable('cart_items', {
    id: 'id',
    cart_id: { type: 'integer', notNull: true, references: 'carts(id)', onDelete: 'CASCADE' },
    product_id: { type: 'integer', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    variant_id: { type: 'integer', references: 'product_variants(id)', onDelete: 'SET NULL' },
    quantity: { type: 'integer', notNull: true, default: 1 },
    price_at_add: { type: 'decimal(10,2)', notNull: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // coupons table (must be created before orders)
  pgm.createTable('coupons', {
    id: 'id',
    code: { type: 'varchar(50)', notNull: true, unique: true },
    discount_type: { type: 'varchar(10)', notNull: true, check: "discount_type IN ('FLAT', 'PERCENT')" },
    discount_value: { type: 'decimal(10,2)', notNull: true },
    minimum_order: { type: 'decimal(10,2)', notNull: true, default: 0 },
    maximum_discount: { type: 'decimal(10,2)' },
    start_date: { type: 'timestamp', notNull: true },
    expiry_date: { type: 'timestamp', notNull: true },
    total_usage_limit: { type: 'integer' },
    usage_limit_per_customer: { type: 'integer' },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // orders table
  pgm.createTable('orders', {
    id: 'id',
    order_number: { type: 'varchar(50)', notNull: true, unique: true },
    user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'RESTRICT' },
    address_id: { type: 'integer', notNull: true, references: 'addresses(id)', onDelete: 'RESTRICT' },
    subtotal: { type: 'decimal(10,2)', notNull: true },
    coupon_discount: { type: 'decimal(10,2)', notNull: true, default: 0 },
    referral_discount: { type: 'decimal(10,2)', notNull: true, default: 0 },
    shipping_fee: { type: 'decimal(10,2)', notNull: true, default: 0 },
    final_amount: { type: 'decimal(10,2)', notNull: true },
    order_status: { type: 'varchar(50)', notNull: true },
    coupon_id: { type: 'integer', references: 'coupons(id)', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // order_items table
  pgm.createTable('order_items', {
    id: 'id',
    order_id: { type: 'integer', notNull: true, references: 'orders(id)', onDelete: 'CASCADE' },
    product_id: { type: 'integer', references: 'products(id)', onDelete: 'SET NULL' },
    variant_id: { type: 'integer', references: 'product_variants(id)', onDelete: 'SET NULL' },
    product_name: { type: 'varchar(255)', notNull: true },
    color: { type: 'varchar(50)' },
    size: { type: 'varchar(50)' },
    quantity: { type: 'integer', notNull: true },
    price_at_purchase: { type: 'decimal(10,2)', notNull: true }
  });

  // payments table
  pgm.createTable('payments', {
    id: 'id',
    order_id: { type: 'integer', notNull: true, references: 'orders(id)', onDelete: 'CASCADE' },
    payment_method: { type: 'varchar(50)', notNull: true },
    amount: { type: 'decimal(10,2)', notNull: true },
    utr_number: { type: 'varchar(100)' },
    screenshot_url: { type: 'varchar(500)' },
    payment_status: { type: 'varchar(50)', notNull: true },
    rejection_reason: { type: 'text' },
    verified_by_admin_id: { type: 'integer', references: 'users(id)', onDelete: 'SET NULL' },
    verified_at: { type: 'timestamp' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // coupon_usages table
  pgm.createTable('coupon_usages', {
    id: 'id',
    coupon_id: { type: 'integer', notNull: true, references: 'coupons(id)', onDelete: 'CASCADE' },
    user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    order_id: { type: 'integer', notNull: true, references: 'orders(id)', onDelete: 'CASCADE' },
    used_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // referral_settings table
  pgm.createTable('referral_settings', {
    id: 'id',
    is_enabled: { type: 'boolean', notNull: true, default: true },
    reward_type: { type: 'varchar(10)', notNull: true, check: "reward_type IN ('FLAT', 'PERCENT')" },
    new_customer_reward_value: { type: 'decimal(10,2)', notNull: true },
    referrer_reward_value: { type: 'decimal(10,2)', notNull: true },
    minimum_order: { type: 'decimal(10,2)', notNull: true, default: 0 },
    maximum_discount: { type: 'decimal(10,2)' },
    reward_validity_days: { type: 'integer', notNull: true, default: 30 },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // referrals table
  pgm.createTable('referrals', {
    id: 'id',
    referrer_user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    referred_user_id: { type: 'integer', references: 'users(id)', onDelete: 'CASCADE' },
    referral_code_used: { type: 'varchar(50)', notNull: true },
    status: { type: 'varchar(50)', notNull: true, check: "status IN ('PENDING', 'REGISTERED', 'QUALIFIED', 'REWARD_AVAILABLE', 'REWARD_USED')" },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // referral_rewards table
  pgm.createTable('referral_rewards', {
    id: 'id',
    referral_id: { type: 'integer', notNull: true, references: 'referrals(id)', onDelete: 'CASCADE' },
    user_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'CASCADE' },
    reward_amount: { type: 'decimal(10,2)', notNull: true },
    is_used: { type: 'boolean', notNull: true, default: false },
    is_approved: { type: 'boolean', notNull: true, default: false },
    order_id_used_on: { type: 'integer', references: 'orders(id)', onDelete: 'SET NULL' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // banners table
  pgm.createTable('banners', {
    id: 'id',
    image_url: { type: 'varchar(500)', notNull: true },
    link_url: { type: 'varchar(500)' },
    banner_type: { type: 'varchar(10)', notNull: true, check: "banner_type IN ('HOME', 'OFFER')" },
    display_order: { type: 'integer', notNull: true, default: 0 },
    is_active: { type: 'boolean', notNull: true, default: true },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  // Indexes for foreign keys and frequently filtered columns
  pgm.createIndex('addresses', 'user_id');
  pgm.createIndex('categories', 'parent_id');
  pgm.createIndex('products', 'category_id');
  pgm.createIndex('product_images', 'product_id');
  pgm.createIndex('product_variants', 'product_id');
  pgm.createIndex('carts', 'user_id');
  pgm.createIndex('cart_items', 'cart_id');
  pgm.createIndex('cart_items', 'product_id');
  pgm.createIndex('cart_items', 'variant_id');
  pgm.createIndex('orders', 'user_id');
  pgm.createIndex('orders', 'address_id');
  pgm.createIndex('orders', 'coupon_id');
  pgm.createIndex('orders', 'order_status');
  pgm.createIndex('order_items', 'order_id');
  pgm.createIndex('order_items', 'product_id');
  pgm.createIndex('order_items', 'variant_id');
  pgm.createIndex('payments', 'order_id');
  pgm.createIndex('payments', 'verified_by_admin_id');
  pgm.createIndex('coupon_usages', 'coupon_id');
  pgm.createIndex('coupon_usages', 'user_id');
  pgm.createIndex('coupon_usages', 'order_id');
  pgm.createIndex('referrals', 'referrer_user_id');
  pgm.createIndex('referrals', 'referred_user_id');
  pgm.createIndex('referral_rewards', 'referral_id');
  pgm.createIndex('referral_rewards', 'user_id');
  pgm.createIndex('referral_rewards', 'order_id_used_on');
  pgm.createIndex('users', 'referred_by_user_id');

  // Unique constraint for product_variants (product_id, color, size)
  pgm.addConstraint('product_variants', 'product_variants_product_id_color_size_key', {
    unique: ['product_id', 'color', 'size']
  });
};

exports.down = (pgm) => {
  // Drop tables in reverse order of creation
  pgm.dropTable('banners');
  pgm.dropTable('referral_rewards');
  pgm.dropTable('referrals');
  pgm.dropTable('referral_settings');
  pgm.dropTable('coupon_usages');
  pgm.dropTable('coupons');
  pgm.dropTable('payments');
  pgm.dropTable('order_items');
  pgm.dropTable('orders');
  pgm.dropTable('cart_items');
  pgm.dropTable('carts');
  pgm.dropTable('product_variants');
  pgm.dropTable('product_images');
  pgm.dropTable('products');
  pgm.dropTable('categories');
  pgm.dropTable('addresses');
  pgm.dropTable('users');
};