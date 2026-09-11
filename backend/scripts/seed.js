require('dotenv-flow/config');
const bcrypt = require('bcryptjs');
const pool = require('../src/config/database');

// Helper function to check if table has data
async function hasData(tableName) {
  const result = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
  return parseInt(result.rows[0].count) > 0;
}

// Helper function to check if specific record exists
async function recordExists(tableName, whereClause, values) {
  const query = `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`;
  const result = await pool.query(query, values);
  return parseInt(result.rows[0].count) > 0;
}

// Helper to generate unique referral code
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SRR50';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to generate SKU
function generateSKU(name, color, size) {
  const prefix = name.split(' ').map(w => w[0]).join('').toUpperCase();
  const colorCode = color ? color.substring(0, 3).toUpperCase() : 'GEN';
  const sizeCode = size ? size.toUpperCase() : 'STD';
  return `${prefix}-${colorCode}-${sizeCode}-${Date.now().toString().slice(-4)}`;
}

// Helper to generate order number
function generateOrderNumber() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// Helper to generate UTR number
function generateUTR() {
  return `UTR${Date.now().toString().slice(-12)}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
}

// Image placeholder URLs
const IMAGE_PLACEHOLDERS = {
  products: [
    'https://placehold.co/600x800/e2e8f0/1a202c?text=Product+1',
    'https://placehold.co/600x800/fef3c7/1a202c?text=Product+2',
    'https://placehold.co/600x800/d1fae5/1a202c?text=Product+3',
    'https://placehold.co/600x800/fee2e2/1a202c?text=Product+4',
    'https://placehold.co/600x800/e0e7ff/1a202c?text=Product+5',
    'https://placehold.co/600x800/f3e8ff/1a202c?text=Product+6',
    'https://placehold.co/600x800/fae8ff/1a202c?text=Product+7',
    'https://placehold.co/600x800/ffe4e6/1a202c?text=Product+8',
    'https://placehold.co/600x800/fff4e6/1a202c?text=Product+9',
    'https://placehold.co/600x800/e6fffa/1a202c?text=Product+10',
    'https://placehold.co/600x800/fff1f1/1a202c?text=Product+11',
    'https://placehold.co/600x800/f0fdf4/1a202c?text=Product+12',
    'https://placehold.co/600x800/fef9c3/1a202c?text=Product+13',
    'https://placehold.co/600x800/ecfccb/1a202c?text=Product+14',
    'https://placehold.co/600x800/dcfce7/1a202c?text=Product+15',
    'https://placehold.co/600x800/f3f4f6/1a202c?text=Product+16',
    'https://placehold.co/600x800/e5e7eb/1a202c?text=Product+17',
    'https://placehold.co/600x800/d1d5db/1a202c?text=Product+18',
    'https://placehold.co/600x800/f8fafc/1a202c?text=Product+19',
    'https://placehold.co/600x800/1e293b/ffffff?text=Product+20'
  ],
  banners: [
    'https://placehold.co/1200x400/1a202c/ffffff?text=Home+Banner+1',
    'https://placehold.co/1200x400/059669/ffffff?text=Home+Banner+2',
    'https://placehold.co/1200x400/0d9488/ffffff?text=Home+Banner+3',
    'https://placehold.co/1200x300/7c3aed/ffffff?text=Offer+Banner+1',
    'https://placehold.co/1200x300/dc2626/ffffff?text=Offer+Banner+2'
  ]
};

// Customer data
const customers = [
  { full_name: 'Aarav Sharma', email: 'aarav.sharma@example.com', mobile_number: '9876543210' },
  { full_name: 'Vihaan Patel', email: 'vihaan.patel@example.com', mobile_number: '9876543211' },
  { full_name: 'Aditya Singh', email: 'aditya.singh@example.com', mobile_number: '9876543212' },
  { full_name: 'Kavya Reddy', email: 'kavya.reddy@example.com', mobile_number: '9876543213' },
  { full_name: 'Ishaan Kumar', email: 'ishaan.kumar@example.com', mobile_number: '9876543214' },
  { full_name: 'Diya Nair', email: 'diya.nair@example.com', mobile_number: '9876543215' },
  { full_name: 'Rohan Gupta', email: 'rohan.gupta@example.com', mobile_number: '9876543216' },
  { full_name: 'Ananya Verma', email: 'ananya.verma@example.com', mobile_number: '9876543217' },
  { full_name: 'Kabir Mehta', email: 'kabir.mehta@example.com', mobile_number: '9876543218' },
  { full_name: 'Sanya Choudhury', email: 'sanya.choudhury@example.com', mobile_number: '9876543219' },
  { full_name: 'Arjun Das', email: 'arjun.das@example.com', mobile_number: '9876543220' },
  { full_name: 'Myra Iyer', email: 'myra.iyer@example.com', mobile_number: '9876543221' },
  { full_name: 'Vivaan Rao', email: 'vivaan.rao@example.com', mobile_number: '9876543222' },
  { full_name: 'Anika Krishnan', email: 'anika.krishnan@example.com', mobile_number: '9876543223' },
  { full_name: 'Ayaan Pillai', email: 'ayaan.pillai@example.com', mobile_number: '9876543224' }
];

// Categories
const categories = [
  { name: 'Men', display_order: 1 },
  { name: 'Women', display_order: 2 },
  { name: 'Kids', display_order: 3 },
  { name: 'Footwear', display_order: 4 },
  { name: 'Accessories', display_order: 5 }
];

// Products
const products = [
  { name: 'Men\'s Cotton T-Shirt', category: 'Men', regular_price: 799, selling_price: 599, description: 'Comfortable 100% cotton t-shirt for men. Perfect for casual wear.' },
  { name: 'Men\'s Casual Shirt', category: 'Men', regular_price: 1299, selling_price: 999, description: 'Stylish casual shirt for men. Made from premium cotton blend.' },
  { name: 'Men\'s Polo Shirt', category: 'Men', regular_price: 899, selling_price: 699, description: 'Classic polo shirt with collar. Breathable fabric for all-day comfort.' },
  { name: 'Men\'s Jeans', category: 'Men', regular_price: 1499, selling_price: 1199, description: 'Classic fit jeans for men. Durable denim with stretch comfort.' },
  { name: 'Women\'s Floral Dress', category: 'Women', regular_price: 1599, selling_price: 1299, description: 'Beautiful floral print dress. Perfect for summer outings and parties.' },
  { name: 'Women\'s Cotton Kurti', category: 'Women', regular_price: 999, selling_price: 799, description: 'Traditional cotton kurti with modern design. Comfortable for daily wear.' },
  { name: 'Women\'s Saree', category: 'Women', regular_price: 2499, selling_price: 1999, description: 'Elegant silk saree with intricate embroidery. Perfect for festive occasions.' },
  { name: 'Women\'s Top', category: 'Women', regular_price: 699, selling_price: 499, description: 'Stylish top for women. Available in various colors.' },
  { name: 'Kids Hoodie', category: 'Kids', regular_price: 899, selling_price: 699, description: 'Comfortable hoodie for kids. Made from soft, skin-friendly fabric.' },
  { name: 'Kids T-Shirt', category: 'Kids', regular_price: 499, selling_price: 399, description: 'Colorful t-shirt for kids. 100% cotton material.' },
  { name: 'Kids Jeans', category: 'Kids', regular_price: 799, selling_price: 599, description: 'Durable jeans for kids. Comfortable stretch fit.' },
  { name: 'Kids Dress', category: 'Kids', regular_price: 699, selling_price: 499, description: 'Cute dress for kids. Perfect for parties and casual wear.' },
  { name: 'Sneakers', category: 'Footwear', regular_price: 1999, selling_price: 1499, description: 'Comfortable sneakers for everyday wear. Memory foam insole.' },
  { name: 'Running Shoes', category: 'Footwear', regular_price: 2499, selling_price: 1999, description: 'High-performance running shoes. Lightweight and breathable.' },
  { name: 'Loafers', category: 'Footwear', regular_price: 1799, selling_price: 1399, description: 'Classic loafers for men. Premium leather finish.' },
  { name: 'Handbag', category: 'Accessories', regular_price: 1299, selling_price: 999, description: 'Stylish handbag for women. Multiple compartments.' },
  { name: 'Sunglasses', category: 'Accessories', regular_price: 999, selling_price: 699, description: 'UV protection sunglasses. Trendy design for all face shapes.' },
  { name: 'Watch', category: 'Accessories', regular_price: 2999, selling_price: 2499, description: 'Elegant watch with stainless steel strap. Water resistant.' },
  { name: 'Belt', category: 'Accessories', regular_price: 599, selling_price: 399, description: 'Genuine leather belt. Available in multiple colors.' },
  { name: 'Wallet', category: 'Accessories', regular_price: 899, selling_price: 699, description: 'Slim wallet with multiple card slots. RFID blocking.' }
];

// Variant colors and sizes
const colors = ['Red', 'Black', 'White', 'Blue', 'Green', 'Yellow', 'Navy'];
const sizes = ['S', 'M', 'L', 'XL', 'XXL'];

// Addresses (Indian cities)
const addresses = [
  { city: 'Hyderabad', state: 'Telangana', pincode: '500001' },
  { city: 'Bangalore', state: 'Karnataka', pincode: '560001' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' }
];

// Order statuses
const orderStatuses = ['CONFIRMED', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// Payment statuses
const paymentStatuses = ['PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'APPROVED', 'REJECTED'];

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // 1. Seed Admin User
    console.log('\nSeeding admin user...');
    const adminExists = await client.query(
      'SELECT id FROM users WHERE email = $1 AND role = $2',
      ['admin@taxserves.com', 'ADMIN']
    );
    
    let adminId;
    if (adminExists.rows.length > 0) {
      console.log('Admin user already exists');
      adminId = adminExists.rows[0].id;
    } else {
      const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
      const adminResult = await client.query(
        `INSERT INTO users (full_name, email, mobile_number, password_hash, role, is_active)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        ['System Administrator', 'admin@taxserves.com', '0000000000', adminPasswordHash, 'ADMIN', true]
      );
      adminId = adminResult.rows[0].id;
      console.log('Admin user created');
    }
    
    // 2. Seed Customer Users
    console.log('\nSeeding customers...');
    const customerIds = [];
    const testPasswordHash = await bcrypt.hash('TestPass@123', 10);
    
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const email = customer.email;
      const mobile = customer.mobile_number;
      
      const existingCustomer = await client.query(
        'SELECT id FROM users WHERE (email = $1 OR mobile_number = $2) AND role = $3',
        [email, mobile, 'CUSTOMER']
      );
      
      if (existingCustomer.rows.length > 0) {
        console.log(`Customer ${email} or mobile ${mobile} already exists`);
        customerIds.push(existingCustomer.rows[0].id);
      } else {
        const passwordHash = i < 5 ? testPasswordHash : await bcrypt.hash('TestPass@123', 10);
        const result = await client.query(
          `INSERT INTO users (full_name, email, mobile_number, password_hash, role, is_active)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [customer.full_name, email, mobile, passwordHash, 'CUSTOMER', true]
        );
        customerIds.push(result.rows[0].id);
        console.log(`Customer ${email} created`);
      }
    }
    
    // 3. Seed Categories
    console.log('\nSeeding categories...');
    const categoryIds = {};
    
    for (const category of categories) {
      const existingCategory = await client.query(
        'SELECT id FROM categories WHERE name = $1',
        [category.name]
      );
      
      if (existingCategory.rows.length > 0) {
        categoryIds[category.name] = existingCategory.rows[0].id;
        console.log(`Category ${category.name} already exists`);
      } else {
        const result = await client.query(
          `INSERT INTO categories (name, display_order) VALUES ($1, $2) RETURNING id`,
          [category.name, category.display_order]
        );
        categoryIds[category.name] = result.rows[0].id;
        console.log(`Category ${category.name} created`);
      }
    }
    
    // 4. Seed Products
    console.log('\nSeeding products...');
    const productIds = {};
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const categoryId = categoryIds[product.category];
      const discount = product.regular_price - product.selling_price;
      
      const existingProduct = await client.query(
        'SELECT id FROM products WHERE name = $1',
        [product.name]
      );
      
      let productId;
      if (existingProduct.rows.length > 0) {
        productId = existingProduct.rows[0].id;
        console.log(`Product ${product.name} already exists`);
      } else {
        const result = await client.query(
          `INSERT INTO products (name, description, category_id, regular_price, selling_price, discount)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [product.name, product.description, categoryId, product.regular_price, product.selling_price, discount]
        );
        productId = result.rows[0].id;
        console.log(`Product ${product.name} created`);
      }
      productIds[product.name] = productId;
      
      // Add product image
      await client.query(
        'INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [productId, IMAGE_PLACEHOLDERS.products[i % IMAGE_PLACEHOLDERS.products.length], 0]
      );
    }
    
    // 5. Seed Product Variants
    console.log('\nSeeding product variants...');
    const variantIds = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      const productId = productIds[product.name];
      
      // Create variants with different stock scenarios
      const numVariants = 3 + (i % 3); // 3-5 variants per product
      const stockScenario = i % 3; // 0: normal, 1: low stock, 2: out of stock
      
      for (let j = 0; j < numVariants; j++) {
        const color = colors[j % colors.length];
        const size = sizes[j % sizes.length];
        const sku = generateSKU(product.name, color, size);
        
        let stockQuantity;
        if (stockScenario === 0) {
          stockQuantity = 50 + Math.floor(Math.random() * 50); // 50-100
        } else if (stockScenario === 1) {
          stockQuantity = 1 + Math.floor(Math.random() * 4); // 1-5 (low stock)
        } else {
          stockQuantity = 0; // out of stock
        }
        
        const existingVariant = await client.query(
          'SELECT id FROM product_variants WHERE product_id = $1 AND color = $2 AND size = $3',
          [productId, color, size]
        );
        
        if (existingVariant.rows.length === 0) {
          const result = await client.query(
            `INSERT INTO product_variants (product_id, color, size, sku, stock_quantity)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [productId, color, size, sku, stockQuantity]
          );
          variantIds.push(result.rows[0].id);
        }
      }
    }
    
    // 6. Seed Banners
    console.log('\nSeeding banners...');
    const bannerTypes = ['HOME', 'OFFER'];
    const bannerData = [
      { banner_type: 'HOME', display_order: 1 },
      { banner_type: 'HOME', display_order: 2 },
      { banner_type: 'HOME', display_order: 3 },
      { banner_type: 'OFFER', display_order: 1 },
      { banner_type: 'OFFER', display_order: 2 }
    ];
    
    for (let i = 0; i < bannerData.length; i++) {
      const banner = bannerData[i];
      const existingBanner = await client.query(
        'SELECT id FROM banners WHERE banner_type = $1 AND display_order = $2',
        [banner.banner_type, banner.display_order]
      );
      
      if (existingBanner.rows.length === 0) {
        await client.query(
          `INSERT INTO banners (image_url, link_url, banner_type, display_order)
           VALUES ($1, $2, $3, $4)`,
          [IMAGE_PLACEHOLDERS.banners[i], '#', banner.banner_type, banner.display_order]
        );
        console.log(`Banner ${banner.banner_type} ${banner.display_order} created`);
      }
    }
    
    // 7. Seed Customer Addresses
    console.log('\nSeeding customer addresses...');
    for (let i = 0; i < Math.min(10, customerIds.length); i++) {
      const userId = customerIds[i];
      const address = addresses[i % addresses.length];
      
      const existingAddress = await client.query(
        'SELECT id FROM addresses WHERE user_id = $1',
        [userId]
      );
      
      if (existingAddress.rows.length === 0) {
        await client.query(
          `INSERT INTO addresses (user_id, name, mobile_number, house_flat, street_area, city, state, pincode, landmark, is_default)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            userId,
            customers[i].full_name,
            customers[i].mobile_number,
            `${Math.floor(Math.random() * 200) + 1}, Flat ${String.fromCharCode(65 + i)}`,
            `Street ${Math.floor(Math.random() * 50) + 1}, Sector ${Math.floor(Math.random() * 10) + 1}`,
            address.city,
            address.state,
            address.pincode,
            `Near ${['Park', 'Temple', 'School', 'Market', 'Hospital'][i % 5]}`,
            true
          ]
        );
        console.log(`Address for user ${userId} created`);
      }
    }
    
    // 8. Seed Coupons
    console.log('\nSeeding coupons...');
    const coupons = [
      { code: 'SAVE10', discount_type: 'PERCENT', discount_value: 10, minimum_order: 500, maximum_discount: 100, start_date: new Date(), expiry_date: new Date(Date.now() + 30*24*60*60*1000), total_usage_limit: 100, usage_limit_per_customer: 1, is_active: true },
      { code: 'SAVE20', discount_type: 'PERCENT', discount_value: 20, minimum_order: 1000, maximum_discount: 200, start_date: new Date(), expiry_date: new Date(Date.now() + 60*24*60*60*1000), total_usage_limit: 50, usage_limit_per_customer: 1, is_active: true },
      { code: 'WELCOME50', discount_type: 'FLAT', discount_value: 50, minimum_order: 200, maximum_discount: 50, start_date: new Date(), expiry_date: new Date(Date.now() + 90*24*60*60*1000), total_usage_limit: 200, usage_limit_per_customer: 1, is_active: true },
      { code: 'EXPIRED10', discount_type: 'PERCENT', discount_value: 10, minimum_order: 500, maximum_discount: 50, start_date: new Date(Date.now() - 60*24*60*60*1000), expiry_date: new Date(Date.now() - 30*24*60*60*1000), total_usage_limit: 100, usage_limit_per_customer: 1, is_active: false },
      { code: 'TESTINACTIVE', discount_type: 'PERCENT', discount_value: 15, minimum_order: 500, maximum_discount: 75, start_date: new Date(), expiry_date: new Date(Date.now() + 30*24*60*60*1000), total_usage_limit: 100, usage_limit_per_customer: 1, is_active: false }
    ];
    
    for (const coupon of coupons) {
      const existingCoupon = await client.query(
        'SELECT id FROM coupons WHERE code = $1',
        [coupon.code]
      );
      
      if (existingCoupon.rows.length === 0) {
        await client.query(
          `INSERT INTO coupons (code, discount_type, discount_value, minimum_order, maximum_discount, start_date, expiry_date, total_usage_limit, usage_limit_per_customer, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [coupon.code, coupon.discount_type, coupon.discount_value, coupon.minimum_order, coupon.maximum_discount, coupon.start_date, coupon.expiry_date, coupon.total_usage_limit, coupon.usage_limit_per_customer, coupon.is_active]
        );
        console.log(`Coupon ${coupon.code} created`);
      }
    }
    
    // 9. Seed Offers
    console.log('\nSeeding offers...');
    const offers = [
      { title: '₹100 OFF', description: 'On Your First Order', offer_type: 'FIRST_ORDER', discount_type: 'FIXED', discount_value: 100, minimum_order_value: 0, maximum_discount: 100, coupon_code: null, is_active: true, start_date: new Date(), end_date: null, usage_limit: null, per_user_limit: null },
      { title: '₹50 OFF', description: 'Refer a Friend', offer_type: 'REFERRAL', discount_type: 'FIXED', discount_value: 50, minimum_order_value: 0, maximum_discount: 50, coupon_code: null, is_active: true, start_date: new Date(), end_date: null, usage_limit: null, per_user_limit: null },
      { title: '₹50 OFF', description: 'On Your Next Order', offer_type: 'NEXT_ORDER', discount_type: 'FIXED', discount_value: 50, minimum_order_value: 0, maximum_discount: 50, coupon_code: null, is_active: true, start_date: new Date(), end_date: null, usage_limit: null, per_user_limit: null },
      { title: '₹100 OFF', description: 'Special Offers', offer_type: 'SPECIAL', discount_type: 'FIXED', discount_value: 100, minimum_order_value: 0, maximum_discount: 100, coupon_code: null, is_active: true, start_date: new Date(), end_date: null, usage_limit: null, per_user_limit: null },
      { title: '₹50 OFF', description: 'Birthday Reward', offer_type: 'BIRTHDAY', discount_type: 'FIXED', discount_value: 50, minimum_order_value: 0, maximum_discount: 50, coupon_code: null, is_active: true, start_date: new Date(), end_date: null, usage_limit: null, per_user_limit: null }
    ];
    
    for (const offer of offers) {
      const existingOffer = await client.query(
        'SELECT id FROM offers WHERE offer_type = $1',
        [offer.offer_type]
      );
      
      if (existingOffer.rows.length === 0) {
        await client.query(
          `INSERT INTO offers (title, description, offer_type, discount_type, discount_value, minimum_order_value, maximum_discount, coupon_code, is_active, start_date, end_date, usage_limit, per_user_limit)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
          [offer.title, offer.description, offer.offer_type, offer.discount_type, offer.discount_value, offer.minimum_order_value, offer.maximum_discount, offer.coupon_code, offer.is_active, offer.start_date, offer.end_date, offer.usage_limit, offer.per_user_limit]
        );
        console.log(`Offer ${offer.offer_type} created`);
      }
    }
    
    // 10. Seed Referral Settings
    console.log('\nSeeding referral settings...');
    const existingReferralSettings = await client.query('SELECT id FROM referral_settings');
    
    if (existingReferralSettings.rows.length === 0) {
      await client.query(
        `INSERT INTO referral_settings (is_enabled, reward_type, new_customer_reward_value, referrer_reward_value, minimum_order, maximum_discount, reward_validity_days)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [true, 'PERCENT', 10, 5, 500, 100, 30]
      );
      console.log('Referral settings created');
    }
    
    // 10. Seed Orders and Payments
    console.log('\nSeeding orders and payments...');
    
    for (let i = 0; i < 10; i++) {
      const userId = customerIds[i % customerIds.length];
      const orderStatus = orderStatuses[i % orderStatuses.length];
      const paymentStatus = paymentStatuses[i % paymentStatuses.length];
      
      // Get user's default address
      const addressResult = await client.query(
        'SELECT id FROM addresses WHERE user_id = $1 AND is_default = true',
        [userId]
      );
      
      if (addressResult.rows.length === 0) {
        console.log(`No default address found for user ${userId}, skipping order`);
        continue;
      }
      
      const addressId = addressResult.rows[0].id;
      
      // Get a random product and variant
      const productKeys = Object.keys(productIds);
      const randomProductKey = productKeys[Math.floor(Math.random() * productKeys.length)];
      const productId = productIds[randomProductKey];
      
      const variantResult = await client.query(
        'SELECT id FROM product_variants WHERE product_id = $1 LIMIT 1',
        [productId]
      );
      
      if (variantResult.rows.length === 0) {
        console.log(`No variants found for product ${randomProductKey}, skipping order`);
        continue;
      }
      
      const variantId = variantResult.rows[0].id;
      const price = products.find(p => p.name === randomProductKey).selling_price;
      
      const orderNumber = generateOrderNumber();
      const quantity = 1 + Math.floor(Math.random() * 2);
      const subtotal = price * quantity;
      const finalAmount = subtotal + 50; // Add shipping fee
      
      // Check if order number already exists
      const existingOrder = await client.query(
        'SELECT id FROM orders WHERE order_number = $1',
        [orderNumber]
      );
      
      if (existingOrder.rows.length > 0) {
        console.log(`Order ${orderNumber} already exists`);
        continue;
      }
      
      const orderResult = await client.query(
        `INSERT INTO orders (order_number, user_id, address_id, subtotal, coupon_discount, referral_discount, shipping_fee, final_amount, order_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [orderNumber, userId, addressId, subtotal, 0, 0, 50, finalAmount, orderStatus]
      );
      
      const orderId = orderResult.rows[0].id;
      
      // Add order item
      await client.query(
        `INSERT INTO order_items (order_id, product_id, variant_id, product_name, color, size, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, productId, variantId, randomProductKey, colors[Math.floor(Math.random() * colors.length)], sizes[Math.floor(Math.random() * sizes.length)], quantity, price]
      );
      
      // Add payment
      const utr = generateUTR();
      await client.query(
        `INSERT INTO payments (order_id, payment_method, amount, utr_number, payment_status)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, 'UPI', finalAmount, utr, paymentStatus]
      );
      
      console.log(`Order ${orderNumber} created with status ${orderStatus} and payment ${paymentStatus}`);
    }
    
    await client.query('COMMIT');
    console.log('\n✅ Database seeding completed successfully!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`- Admin user: admin@taxserves.com / Admin@123`);
    console.log(`- Customer users: ${customerIds.length}`);
    console.log(`- Categories: ${Object.keys(categoryIds).length}`);
    console.log(`- Products: ${Object.keys(productIds).length}`);
    console.log(`- Product variants: ${variantIds.length}`);
    console.log(`- Banners: 5`);
    console.log(`- Coupons: 5`);
    console.log(`- Offers: 5`);
    console.log(`- Orders: 10`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Reset function - only for development
async function reset() {
  if (process.env.NODE_ENV !== 'development') {
    console.error('❌ Reset is only allowed in development environment!');
    process.exit(1);
  }
  
  console.log('⚠️  WARNING: This will delete all data from the database!');
  console.log('This operation cannot be undone!');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const answer = await new Promise(resolve => {
    rl.question('Are you sure you want to reset the database? (yes/no): ', resolve);
  });
  
  rl.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('Reset cancelled.');
    process.exit(0);
  }
  
  const client = await pool.connect();
  
  try {
    console.log('Resetting database...');
    await client.query('BEGIN');
    
    // Drop tables in reverse order of creation
    const tables = [
      'inventory_stock_logs',
      'referral_rewards',
      'referrals',
      'referral_settings',
      'coupon_usages',
      'coupons',
      'offers',
      'payments',
      'order_items',
      'orders',
      'cart_items',
      'carts',
      'product_variants',
      'product_images',
      'products',
      'categories',
      'addresses',
      'users'
    ];
    
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`Dropped table: ${table}`);
      } catch (err) {
        console.log(`Warning: Could not drop table ${table}: ${err.message}`);
      }
    }
    
    await client.query('COMMIT');
    console.log('✅ Database reset completed. Please run migrations and seed again.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error resetting database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const command = process.argv[2];

if (command === 'reset') {
  reset();
} else {
  seed();
}