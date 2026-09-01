require('dotenv-flow/config');
const pool = require('../src/config/database');

async function setupSchema() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating tables...');
    
    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        mobile_number VARCHAR(20) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('CUSTOMER', 'ADMIN')),
        referral_code VARCHAR(50) UNIQUE,
        referred_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ users table created');
    
    // Addresses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        mobile_number VARCHAR(20) NOT NULL,
        house_flat VARCHAR(255) NOT NULL,
        street_area VARCHAR(255) NOT NULL,
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        landmark VARCHAR(255),
        is_default BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ addresses table created');
    
    // Categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        image_url VARCHAR(500),
        display_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ categories table created');
    
    // Products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
        regular_price DECIMAL(10,2) NOT NULL,
        selling_price DECIMAL(10,2) NOT NULL,
        discount DECIMAL(10,2) NOT NULL DEFAULT 0,
        video_url VARCHAR(500),
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add video_url column to existing products table
    await client.query(`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS video_url VARCHAR(500)
    `);
    console.log('✓ products table created / updated');
    
    // Product images table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_images (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        image_url VARCHAR(500) NOT NULL,
        display_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ product_images table created');
    
    // Product variants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS product_variants (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        color VARCHAR(50) NOT NULL,
        size VARCHAR(50) NOT NULL,
        sku VARCHAR(100) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, color, size)
      )
    `);
    console.log('✓ product_variants table created');
    
    // Carts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ carts table created');
    
    // Cart items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        cart_id INTEGER NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        price_at_add DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ cart_items table created');
    
    // Coupons table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('FLAT', 'PERCENT')),
        discount_value DECIMAL(10,2) NOT NULL,
        minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0,
        maximum_discount DECIMAL(10,2),
        start_date TIMESTAMP NOT NULL,
        expiry_date TIMESTAMP NOT NULL,
        total_usage_limit INTEGER,
        usage_limit_per_customer INTEGER,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ coupons table created');
    
    // Orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) NOT NULL UNIQUE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        address_id INTEGER NOT NULL REFERENCES addresses(id) ON DELETE RESTRICT,
        subtotal DECIMAL(10,2) NOT NULL,
        coupon_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
        referral_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
        shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
        final_amount DECIMAL(10,2) NOT NULL,
        order_status VARCHAR(50) NOT NULL,
        coupon_id INTEGER REFERENCES coupons(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ orders table created');
    
    // Order items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
        variant_id INTEGER REFERENCES product_variants(id) ON DELETE SET NULL,
        product_name VARCHAR(255) NOT NULL,
        color VARCHAR(50),
        size VARCHAR(50),
        quantity INTEGER NOT NULL,
        price_at_purchase DECIMAL(10,2) NOT NULL
      )
    `);
    console.log('✓ order_items table created');
    
    // Payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        payment_method VARCHAR(50) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        utr_number VARCHAR(100),
        screenshot_url VARCHAR(500),
        payment_status VARCHAR(50) NOT NULL,
        rejection_reason TEXT,
        verified_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        verified_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS payment_notes TEXT
    `);
    console.log('✓ payments table created');
    
    // Coupon usages table
    await client.query(`
      CREATE TABLE IF NOT EXISTS coupon_usages (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ coupon_usages table created');
    
    // Referral settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_settings (
        id SERIAL PRIMARY KEY,
        is_enabled BOOLEAN NOT NULL DEFAULT true,
        reward_type VARCHAR(10) NOT NULL CHECK (reward_type IN ('FLAT', 'PERCENT')),
        new_customer_reward_value DECIMAL(10,2) NOT NULL,
        referrer_reward_value DECIMAL(10,2) NOT NULL,
        minimum_order DECIMAL(10,2) NOT NULL DEFAULT 0,
        maximum_discount DECIMAL(10,2),
        reward_validity_days INTEGER NOT NULL DEFAULT 30,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ referral_settings table created');
    
    // Referrals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        referred_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        referral_code_used VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL CHECK (status IN ('PENDING', 'REGISTERED', 'QUALIFIED', 'REWARD_AVAILABLE', 'REWARD_USED')),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ referrals table created');
    
    // Referral rewards table
    await client.query(`
      CREATE TABLE IF NOT EXISTS referral_rewards (
        id SERIAL PRIMARY KEY,
        referral_id INTEGER NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reward_amount DECIMAL(10,2) NOT NULL,
        is_used BOOLEAN NOT NULL DEFAULT false,
        is_approved BOOLEAN NOT NULL DEFAULT false,
        order_id_used_on INTEGER REFERENCES orders(id) ON DELETE SET NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ referral_rewards table created');
    
    // Inventory stock logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_stock_logs (
        id SERIAL PRIMARY KEY,
        variant_id INTEGER NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        old_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        changed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        change_reason VARCHAR(255),
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ inventory_stock_logs table created');
    
    // Create indexes
    console.log('Creating indexes...');
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON addresses(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_address_id ON orders(address_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_payments_verified_by_admin_id ON payments(verified_by_admin_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_id ON coupon_usages(coupon_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_coupon_usages_user_id ON coupon_usages(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_coupon_usages_order_id ON coupon_usages(order_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_referrals_referrer_user_id ON referrals(referrer_user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_id ON referral_rewards(referral_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_referral_rewards_order_id_used_on ON referral_rewards(order_id_used_on)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_referred_by_user_id ON users(referred_by_user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_stock_logs_variant_id ON inventory_stock_logs(variant_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_stock_logs_product_id ON inventory_stock_logs(product_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_inventory_stock_logs_changed_by_admin_id ON inventory_stock_logs(changed_by_admin_id)');
    
    console.log('✓ indexes created');
    
    await client.query('COMMIT');
    console.log('✅ Schema setup completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up schema:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupSchema();