require('dotenv-flow/config');
const pool = require('../config/database');

const getOrCreateCart = async (userId) => {
  // Try to get existing cart
  let cart = await pool.query(
    'SELECT id FROM carts WHERE user_id = $1',
    [userId]
  );

  if (cart.rows.length === 0) {
    // Create new cart
    cart = await pool.query(
      'INSERT INTO carts (user_id) VALUES ($1) RETURNING id',
      [userId]
    );
  }

  return cart.rows[0].id;
};

const addToCart = async (req, res) => {
  const { product_id, variant_id, quantity } = req.body;
  const userId = req.user.id;

  // Validation
  if (!product_id || !variant_id || !quantity) {
    return res.status(400).json({ error: 'product_id, variant_id, and quantity are required' });
  }

  if (quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  try {
    // Check if product is active
    const product = await pool.query(
      'SELECT id, is_active FROM products WHERE id = $1',
      [product_id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.rows[0].is_active) {
      return res.status(400).json({ error: 'Product is not available' });
    }

    // Check if variant exists and belongs to product
    const variant = await pool.query(
      'SELECT id, product_id, stock_quantity FROM product_variants WHERE id = $1',
      [variant_id]
    );

    if (variant.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    if (variant.rows[0].product_id !== parseInt(product_id)) {
      return res.status(400).json({ error: 'Variant does not belong to this product' });
    }

    // Check stock availability
    if (quantity > variant.rows[0].stock_quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        available_stock: variant.rows[0].stock_quantity
      });
    }

    // Get current selling price from backend
    const productPrice = await pool.query(
      'SELECT selling_price FROM products WHERE id = $1',
      [product_id]
    );

    const currentPrice = productPrice.rows[0].selling_price;

    // Get or create cart for user
    const cartId = await getOrCreateCart(userId);

    // Check if item already exists in cart
    const existingItem = await pool.query(
      'SELECT id, quantity FROM cart_items WHERE cart_id = $1 AND product_id = $2 AND variant_id = $3',
      [cartId, product_id, variant_id]
    );

    if (existingItem.rows.length > 0) {
      // Update existing item quantity
      const newQuantity = existingItem.rows[0].quantity + quantity;

      // Check if new quantity exceeds stock
      if (newQuantity > variant.rows[0].stock_quantity) {
        return res.status(400).json({
          error: 'Insufficient stock for requested quantity',
          available_stock: variant.rows[0].stock_quantity,
          current_cart_quantity: existingItem.rows[0].quantity
        });
      }

      await pool.query(
        `UPDATE cart_items
         SET quantity = $1
         WHERE id = $2`,
        [newQuantity, existingItem.rows[0].id]
      );

      // Update cart timestamp
      await pool.query(
        'UPDATE carts SET updated_at = $1 WHERE id = $2',
        [new Date(), cartId]
      );

      res.json({
        message: 'Cart item updated successfully',
        item: {
          id: existingItem.rows[0].id,
          quantity: newQuantity
        }
      });
    } else {
      // Add new item to cart
      const result = await pool.query(
        `INSERT INTO cart_items (cart_id, product_id, variant_id, quantity, price_at_add)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [cartId, product_id, variant_id, quantity, currentPrice]
      );

      // Update cart timestamp
      await pool.query(
        'UPDATE carts SET updated_at = $1 WHERE id = $2',
        [new Date(), cartId]
      );

      res.status(201).json({
        message: 'Item added to cart successfully',
        item: {
          id: result.rows[0].id,
          quantity
        }
      });
    }
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

const updateCartItem = async (req, res) => {
  const { itemId } = req.params;
  const { quantity } = req.body;
  const userId = req.user.id;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  try {
    // Get cart item with validation that it belongs to user
    const cartItem = await pool.query(
      `SELECT ci.id, ci.quantity, ci.variant_id, c.user_id
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only update your own cart items' });
    }

    // Check stock availability
    const variant = await pool.query(
      'SELECT stock_quantity FROM product_variants WHERE id = $1',
      [cartItem.rows[0].variant_id]
    );

    if (variant.rows.length === 0) {
      return res.status(404).json({ error: 'Variant not found' });
    }

    if (quantity > variant.rows[0].stock_quantity) {
      return res.status(400).json({
        error: 'Insufficient stock',
        available_stock: variant.rows[0].stock_quantity
      });
    }

    // Update quantity
    await pool.query(
      `UPDATE cart_items
       SET quantity = $1
       WHERE id = $2`,
      [quantity, itemId]
    );

    // Update cart timestamp
    await pool.query(
      `UPDATE carts
       SET updated_at = $1
       WHERE id = (SELECT cart_id FROM cart_items WHERE id = $2)`,
      [new Date(), itemId]
    );

    res.json({
      message: 'Cart item updated successfully',
      item: {
        id: itemId,
        quantity
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

const removeCartItem = async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user.id;

  try {
    // Validate that item belongs to user's cart
    const cartItem = await pool.query(
      `SELECT ci.id, c.user_id
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (cartItem.rows.length === 0) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You can only remove your own cart items' });
    }

    // Remove item
    await pool.query('DELETE FROM cart_items WHERE id = $1', [itemId]);

    // Update cart timestamp
    await pool.query(
      `UPDATE carts
       SET updated_at = $1
       WHERE id = (SELECT cart_id FROM cart_items WHERE id = $2)`,
      [new Date(), itemId]
    );

    res.json({ message: 'Cart item removed successfully' });
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
};

const getCart = async (req, res) => {
  const userId = req.user.id;

  try {
    // Get user's cart
    const cart = await pool.query(
      'SELECT id FROM carts WHERE user_id = $1',
      [userId]
    );

    if (cart.rows.length === 0) {
      return res.json({
        cart: {
          id: null,
          items: [],
          subtotal: 0,
          total: 0
        }
      });
    }

    const cartId = cart.rows[0].id;

    // Get cart items with current product and variant information
    const items = await pool.query(
      `SELECT
        ci.id as item_id,
        ci.quantity,
        ci.price_at_add,
        ci.created_at as added_at,
        p.id as product_id,
        p.name as product_name,
        p.description as product_description,
        p.regular_price,
        p.selling_price as current_price,
        p.discount,
        pv.id as variant_id,
        pv.color,
        pv.size,
        pv.sku,
        pv.stock_quantity as available_stock,
        pi.image_url,
        c.name as category_name
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       JOIN product_variants pv ON ci.variant_id = pv.id
       LEFT JOIN (
         SELECT DISTINCT ON (product_id) product_id, image_url
         FROM product_images
         ORDER BY product_id, display_order
       ) pi ON p.id = pi.product_id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE ci.cart_id = $1
       ORDER BY ci.created_at DESC`,
      [cartId]
    );

    // Calculate subtotal and total using current backend prices
    let subtotal = 0;
    const itemsWithAvailability = items.rows.map(item => {
      const itemTotal = item.current_price * item.quantity;
      subtotal += itemTotal;

      return {
        item_id: item.item_id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name: item.product_name,
        product_description: item.product_description,
        category_name: item.category_name,
        color: item.color,
        size: item.size,
        sku: item.sku,
        quantity: item.quantity,
        price_at_add: item.price_at_add,
        current_price: item.current_price,
        regular_price: item.regular_price,
        discount: item.discount,
        available_stock: item.available_stock,
        in_stock: item.available_stock > 0,
        can_fulfill_quantity: item.quantity <= item.available_stock,
        item_total: itemTotal,
        image_url: item.image_url,
        added_at: item.added_at
      };
    });

    // Update cart timestamp
    await pool.query(
      'UPDATE carts SET updated_at = $1 WHERE id = $2',
      [new Date(), cartId]
    );

    res.json({
      cart: {
        id: cartId,
        items: itemsWithAvailability,
        subtotal: parseFloat(subtotal.toFixed(2)),
        total: parseFloat(subtotal.toFixed(2)) // Total will include shipping/discounts later
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

module.exports = {
  addToCart,
  updateCartItem,
  removeCartItem,
  getCart
};