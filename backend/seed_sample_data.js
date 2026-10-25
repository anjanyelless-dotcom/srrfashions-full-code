require('dotenv-flow/config');
const bcrypt = require('bcryptjs');
const pool = require('./src/config/database');

const ADMIN_ID = 1;

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // ---------- Customers ----------
    const customers = [
      ['Ananya Reddy', 'ananya.reddy@example.com', '9876543210', '1994-03-15'],
      ['Priya Sharma', 'priya.sharma@example.com', '9876543211', '1990-07-22'],
      ['Sneha Kulkarni', 'sneha.kulkarni@example.com', '9876543212', '1996-11-05'],
      ['Divya Nair', 'divya.nair@example.com', '9876543213', '1988-01-30'],
      ['Meera Iyer', 'meera.iyer@example.com', '9876543214', '1993-05-18'],
      ['Kavya Patel', 'kavya.patel@example.com', '9876543215', '1997-09-09'],
      ['Lakshmi Menon', 'lakshmi.menon@example.com', '9876543216', '1991-12-25'],
      ['Ritu Agarwal', 'ritu.agarwal@example.com', '9876543217', '1995-04-11'],
    ];
    const customerIds = [];
    const hash = await bcrypt.hash('Customer@123', 10);
    for (let i = 0; i < customers.length; i++) {
      const [name, email, mobile, dob] = customers[i];
      const r = await client.query(
        `INSERT INTO users (full_name, email, mobile_number, password_hash, role, referral_code, is_active, date_of_birth)
         VALUES ($1, $2, $3, $4, 'CUSTOMER', $5, true, $6) RETURNING id`,
        [name, email, mobile, hash, `SRR-${1000 + i}`, dob]
      );
      customerIds.push(r.rows[0].id);
    }
    console.log('Customers:', customerIds.length);

    // ---------- Addresses ----------
    const addressData = [
      ['Flat 201, Sai Residency', 'Madhapur, Near Metro Station', 'Hyderabad', 'Telangana', '500081'],
      ['H.No 12-3-45, Green Villas', 'Kukatpally Housing Board', 'Hyderabad', 'Telangana', '500072'],
      ['Plot 78, Lakeview Apartments', 'Gachibowli, DLF Road', 'Hyderabad', 'Telangana', '500032'],
      ['Flat 4B, Sunrise Towers', 'Banjara Hills Road No 10', 'Hyderabad', 'Telangana', '500034'],
      ['H.No 8-2-293, Rose Enclave', 'Jubilee Hills Check Post', 'Hyderabad', 'Telangana', '500033'],
      ['Flat 1102, Palm Heights', 'Kondapur Main Road', 'Hyderabad', 'Telangana', '500084'],
      ['H.No 5-1-88, Old City Home', 'Charminar Market Area', 'Hyderabad', 'Telangana', '500002'],
      ['Villa 22, Spring Meadows', 'Manikonda Jagir', 'Hyderabad', 'Telangana', '500089'],
    ];
    const addressIds = [];
    for (let i = 0; i < customers.length; i++) {
      const [flat, street, city, state, pin] = addressData[i];
      const r = await client.query(
        `INSERT INTO addresses (user_id, name, mobile_number, house_flat, street_area, city, state, pincode, landmark, is_default, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, 'India') RETURNING id`,
        [customerIds[i], customers[i][0], customers[i][2], flat, street, city, state, pin, 'Landmark']
      );
      addressIds.push(r.rows[0].id);
    }
    console.log('Addresses:', addressIds.length);

    // ---------- Categories ----------
    const cats = [
      ['Sarees', 'sarees'],
      ['Dresses', 'dresses'],
      ['Tops', 'tops'],
      ['Cardigans', 'cardigans'],
      ['Handbags', 'handbags'],
      ['Accessories', 'accessories'],
    ];
    const catIds = [];
    for (let i = 0; i < cats.length; i++) {
      const r = await client.query(
        `INSERT INTO categories (name, slug, display_order, is_active) VALUES ($1, $2, $3, true) RETURNING id`,
        [cats[i][0], cats[i][1], i + 1]
      );
      catIds.push(r.rows[0].id);
    }
    console.log('Categories:', catIds.length);

    // ---------- Products ----------
    const products = [
      ['Kanjivaram Silk Saree', 'Elegant Kanjivaram silk saree with zari border, perfect for weddings and festive occasions.', catIds[0], 4999, 3999, 'kanjivaram-silk-saree'],
      ['Banarasi Georgette Saree', 'Traditional Banarasi georgette saree with intricate gold weaving.', catIds[0], 5499, 4499, 'banarasi-georgette-saree'],
      ['Floral Summer Dress', 'Light floral print summer dress in breathable cotton fabric.', catIds[1], 1999, 1499, 'floral-summer-dress'],
      ['A-Line Party Dress', 'Stylish A-line party dress with flattering silhouette.', catIds[1], 2799, 2199, 'a-line-party-dress'],
      ['Cotton Kurti Top', 'Comfortable cotton kurti top with embroidered neckline.', catIds[2], 999, 799, 'cotton-kurti-top'],
      ['Chiffon Crop Top', 'Trendy chiffon crop top for casual outings.', catIds[2], 1299, 999, 'chiffon-crop-top'],
      ['Wool Blend Cardigan', 'Cozy wool blend cardigan for cool evenings.', catIds[3], 1899, 1399, 'wool-blend-cardigan'],
      ['Knit Longline Cardigan', 'Long knit cardigan with side pockets.', catIds[3], 2199, 1699, 'knit-longline-cardigan'],
      ['Leather Tote Handbag', 'Premium leather tote handbag with spacious interior.', catIds[4], 3499, 2799, 'leather-tote-handbag'],
      ['Pearl Stud Earrings', 'Classic pearl stud earrings with gold plating.', catIds[5], 799, 599, 'pearl-stud-earrings'],
    ];
    const productIds = [];
    for (const [name, desc, catId, regular, selling, slug] of products) {
      const r = await client.query(
        `INSERT INTO products (name, description, category_id, regular_price, selling_price, discount, is_active, slug)
         VALUES ($1, $2, $3, $4, $5, $6, true, $7) RETURNING id`,
        [name, desc, catId, regular, selling, Math.round((regular - selling) / regular * 100), slug]
      );
      productIds.push(r.rows[0].id);
    }
    console.log('Products:', productIds.length);

    // ---------- Product images ----------
    const imgs = [
      'wp-content/uploads/sites/383/2026/07/16-1.png',
      'wp-content/uploads/sites/383/2026/07/1.png',
      'wp-content/uploads/sites/383/2026/07/2.png',
    ];
    for (let i = 0; i < productIds.length; i++) {
      await client.query(
        `INSERT INTO product_images (product_id, image_url, display_order) VALUES ($1, $2, 0)`,
        [productIds[i], imgs[i % imgs.length]]
      );
    }
    console.log('Product images:', productIds.length);

    // ---------- Variants ----------
    const variantRows = [];
    const colors = ['Red', 'Blue', 'Green'];
    const sizes = ['S', 'M', 'L'];
    for (let p = 0; p < productIds.length; p++) {
      for (let v = 0; v < 3; v++) {
        const stock = [12, 8, 0, 15, 5, 20, 3, 10, 7, 18][(p + v) % 10];
        const r = await client.query(
          `INSERT INTO product_variants (product_id, color, size, sku, stock_quantity)
           VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          [productIds[p], colors[v], sizes[v], `SRR-${productIds[p]}-${colors[v][0]}${sizes[v]}`, stock]
        );
        variantRows.push({ id: r.rows[0].id, productId: productIds[p], color: colors[v], size: sizes[v], price: products[p][4], name: products[p][0] });
      }
    }
    console.log('Variants:', variantRows.length);

    // ---------- Orders + items + payments ----------
    const orderSpecs = [
      { u: 0, status: 'DELIVERED', days: 20, items: [0, 1], pay: 'PAID', method: 'UPI', utr: 'UTR9876543201' },
      { u: 1, status: 'DELIVERED', days: 15, items: [3, 4], pay: 'PAID', method: 'UPI', utr: 'UTR9876543202' },
      { u: 2, status: 'SHIPPED', days: 5, items: [6], pay: 'PAID', method: 'COD', utr: null },
      { u: 3, status: 'PACKED', days: 3, items: [7, 8], pay: 'PAID', method: 'UPI', utr: 'UTR9876543204' },
      { u: 4, status: 'PROCESSING', days: 2, items: [9], pay: 'PAID', method: 'UPI', utr: 'UTR9876543205' },
      { u: 5, status: 'CONFIRMED', days: 1, items: [10, 11], pay: 'PAID', method: 'CASHFREE', utr: 'CF20261001A1' },
      { u: 6, status: 'PENDING', days: 0, items: [12], pay: 'PENDING', method: 'UPI', utr: null },
      { u: 7, status: 'PAYMENT_VERIFICATION_PENDING', days: 0, items: [13, 14], pay: 'PAYMENT_VERIFICATION_PENDING', method: 'UPI', utr: 'UTR9876543208' },
      { u: 0, status: 'PAYMENT_VERIFICATION_PENDING', days: 0, items: [15], pay: 'PAYMENT_VERIFICATION_PENDING', method: 'UPI', utr: 'UTR9876543209' },
      { u: 1, status: 'PAYMENT_REJECTED', days: 6, items: [16], pay: 'REJECTED', method: 'UPI', utr: 'UTR9876543210', reason: 'UTR number could not be verified' },
      { u: 2, status: 'DELIVERED', days: 25, items: [17, 18], pay: 'PAID', method: 'UPI', utr: 'UTR9876543211' },
      { u: 3, status: 'CANCELLED', days: 10, items: [19], pay: 'REJECTED', method: 'COD', utr: null, reason: 'Cancelled by customer' },
    ];

    for (let i = 0; i < orderSpecs.length; i++) {
      const o = orderSpecs[i];
      const items = o.items.map((vi) => variantRows[vi]);
      const subtotal = items.reduce((s, it) => s + it.price, 0);
      const shipping = subtotal >= 999 ? 0 : 99;
      const final = subtotal + shipping;
      const created = `NOW() - INTERVAL '${o.days} days'`;

      const ord = await client.query(
        `INSERT INTO orders (order_number, user_id, address_id, subtotal, coupon_discount, referral_discount, shipping_fee, final_amount, order_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 0, 0, $5, $6, $7, ${created}, ${created}) RETURNING id`,
        [`ORD-2026-${String(i + 1).padStart(4, '0')}`, customerIds[o.u], addressIds[o.u], subtotal, shipping, final, o.status]
      );
      const orderId = ord.rows[0].id;

      for (const it of items) {
        await client.query(
          `INSERT INTO order_items (order_id, product_id, variant_id, product_name, color, size, quantity, price_at_purchase)
           VALUES ($1, $2, $3, $4, $5, $6, 1, $7)`,
          [orderId, it.productId, it.id, it.name, it.color, it.size, it.price]
        );
      }

      await client.query(
        `INSERT INTO payments (order_id, payment_method, amount, utr_number, payment_status, rejection_reason, verified_by_admin_id, verified_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, ${o.pay === 'PAID' ? created : 'NULL'}, ${created}, ${created})`,
        [orderId, o.method, final, o.utr, o.pay, o.reason || null, o.pay === 'PAID' ? ADMIN_ID : null]
      );
    }
    console.log('Orders:', orderSpecs.length);

    // ---------- Inventory stock logs ----------
    for (let i = 0; i < 5; i++) {
      const v = variantRows[i * 3];
      await client.query(
        `INSERT INTO inventory_stock_logs (variant_id, product_id, old_stock, new_stock, changed_by_admin_id, change_reason)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [v.id, v.productId, 0, [12, 15, 8, 10, 20][i], ADMIN_ID, ['Initial stock received', 'Restocked from supplier', 'New shipment', 'Stock correction', 'Bulk purchase'][i]]
      );
    }
    console.log('Inventory logs: 5');

    // ---------- Banners ----------
    const banners = [
      ['wp-content/uploads/sites/383/2026/07/16-1.png', '/category/sarees', 'HOME', 1],
      ['wp-content/uploads/sites/383/2026/07/1.png', '/category/dresses', 'HOME', 2],
      ['wp-content/uploads/sites/383/2026/07/2.png', '/offers', 'OFFER', 1],
    ];
    for (const [img, link, type, ord] of banners) {
      await client.query(
        `INSERT INTO banners (image_url, link_url, banner_type, display_order, is_active) VALUES ($1, $2, $3, $4, true)`,
        [img, link, type, ord]
      );
    }
    console.log('Banners:', banners.length);

    // ---------- SMS campaigns ----------
    const campaigns = [
      ['Festive Sale Announcement', 'SRR Fashions Festive Sale is LIVE! Get up to 30% off on sarees and dresses. Shop now at srrfashions.in', 'COMPLETED', 8, 8, 0],
      ['New Collection Launch', 'Discover our new ethnic collection at SRR Fashions. Exclusive styles for the season. Visit srrfashions.in today!', 'COMPLETED', 8, 7, 1],
      ['Weekend Offer Reminder', 'Last chance! Weekend special: flat 20% off on all tops and cardigans. Hurry, offer ends tonight!', 'SENDING', 8, 5, 0],
      ['Diwali Special Preview', 'Diwali Special: Preview our exclusive festive collection before anyone else. Early access at srrfashions.in', 'DRAFT', 0, 0, 0],
    ];
    for (const [name, msg, status, total, sent, failed] of campaigns) {
      const c = await client.query(
        `INSERT INTO sms_campaigns (name, message, template_id, sender_id, status, total_recipients, sent_count, failed_count, created_by)
         VALUES ($1, $2, $3, 'SRFSHN', $4, $5, $6, $7, $8) RETURNING id`,
        [name, msg, `TMPL-${name.replace(/\s+/g, '').toUpperCase().slice(0, 10)}`, status, total, sent, failed, ADMIN_ID]
      );
      const cid = c.rows[0].id;
      if (total > 0) {
        for (let i = 0; i < customerIds.length; i++) {
          const isFailed = failed > 0 && i === customerIds.length - 1;
          await client.query(
            `INSERT INTO sms_campaign_recipients (campaign_id, customer_id, mobile, status, error_message, sent_at, delivered_at)
             VALUES ($1, $2, $3, $4, $5, ${isFailed ? 'NULL' : "NOW() - INTERVAL '2 days'"}, ${isFailed ? 'NULL' : "NOW() - INTERVAL '2 days'"})`,
            [cid, customerIds[i], customers[i][2], isFailed ? 'FAILED' : 'DELIVERED', isFailed ? 'Invalid mobile number' : null]
          );
        }
      }
    }
    console.log('SMS campaigns:', campaigns.length);

    await client.query('COMMIT');
    console.log('Seed complete.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', e.message);
    throw e;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
