require('dotenv-flow/config');
const pool = require('../config/database');
const { deleteFile, getFileUrl } = require('../storage/storageAdapter');

function validateVariant(variant, index) {
  const errors = [];
  if (!variant.size || String(variant.size).trim().length === 0) {
    errors.push(`Variant ${index + 1}: Size is required`);
  }
  if (!variant.color || String(variant.color).trim().length === 0) {
    errors.push(`Variant ${index + 1}: Color is required`);
  }
  if (!variant.sku || String(variant.sku).trim().length === 0) {
    errors.push(`Variant ${index + 1}: SKU is required`);
  }
  const stock = Number(variant.stock_quantity);
  if (Number.isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
    errors.push(`Variant ${index + 1}: Stock quantity must be a non-negative integer`);
  }
  return { errors, size: variant.size ? String(variant.size).trim() : '', color: variant.color ? String(variant.color).trim() : '', sku: variant.sku ? String(variant.sku).trim() : '', stock };
}

async function saveProductVariants(client, productId, variants, existingIds = []) {
  const warnings = [];

  if (!Array.isArray(variants) || variants.length === 0) {
    return { warnings };
  }

  // Validate each variant
  const normalized = [];
  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const { errors, size, color, sku, stock } = validateVariant(v, i);
    if (errors.length > 0) {
      throw { validationErrors: errors };
    }
    normalized.push({ id: v.id ? Number(v.id) : null, size, color, sku, stock });
  }

  // Check duplicate color+size within the submitted list
  const combinationSet = new Set();
  for (const v of normalized) {
    const key = `${v.color}|${v.size}`;
    if (combinationSet.has(key)) {
      throw { validationErrors: [`Duplicate color/size combination: ${v.color} / ${v.size}`] };
    }
    combinationSet.add(key);
  }

  // Fetch existing variants for this product
  const existing = await client.query(
    'SELECT id, color, size, sku FROM product_variants WHERE product_id = $1',
    [productId]
  );
  const existingById = new Map(existing.rows.map((r) => [r.id, r]));

  const newIds = new Set(normalized.filter((v) => v.id).map((v) => v.id));

  // Check SKU uniqueness across all variants (except for updates of same variant)
  for (const v of normalized) {
    const skuQuery = v.id
      ? await client.query('SELECT id FROM product_variants WHERE sku = $1 AND id != $2', [v.sku, v.id])
      : await client.query('SELECT id FROM product_variants WHERE sku = $1', [v.sku]);
    if (skuQuery.rows.length > 0) {
      throw { validationErrors: [`SKU must be unique: ${v.sku}`] };
    }
  }

  // Delete existing variants not in the new list (only if not referenced)
  for (const row of existing.rows) {
    if (newIds.has(row.id)) continue;

    const cartRefs = await client.query('SELECT COUNT(*) as count FROM cart_items WHERE variant_id = $1', [row.id]);
    const orderRefs = await client.query('SELECT COUNT(*) as count FROM order_items WHERE variant_id = $1', [row.id]);

    if (parseInt(cartRefs.rows[0].count) > 0 || parseInt(orderRefs.rows[0].count) > 0) {
      warnings.push(`Cannot delete variant ${row.color}/${row.size} because it is referenced in cart or orders`);
      continue;
    }

    await client.query('DELETE FROM product_variants WHERE id = $1', [row.id]);
  }

  // Insert or update variants
  for (const v of normalized) {
    if (v.id && existingById.has(v.id)) {
      // Update
      await client.query(
        `UPDATE product_variants
         SET color = $1, size = $2, sku = $3, stock_quantity = $4, updated_at = $5
         WHERE id = $6`,
        [v.color, v.size, v.sku, v.stock, new Date(), v.id]
      );
    } else {
      // Insert
      await client.query(
        `INSERT INTO product_variants (product_id, color, size, sku, stock_quantity)
         VALUES ($1, $2, $3, $4, $5)`,
        [productId, v.color, v.size, v.sku, v.stock]
      );
    }
  }

  return { warnings };
}

const createProduct = async (req, res) => {
  const { name, description, category_id, regular_price, selling_price, discount, images, video_url, variants } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ error: 'Product name is required' });
  }

  if (!category_id) {
    return res.status(400).json({ error: 'Category ID is required' });
  }

  if (!regular_price || parseFloat(regular_price) <= 0) {
    return res.status(400).json({ error: 'Regular price must be greater than 0' });
  }

  if (!selling_price || parseFloat(selling_price) <= 0) {
    return res.status(400).json({ error: 'Selling price must be greater than 0' });
  }

  // Business rule: selling_price should not be above regular_price
  if (parseFloat(selling_price) > parseFloat(regular_price)) {
    return res.status(400).json({
      error: 'Selling price cannot be greater than regular price',
      warning: 'Selling price should be less than or equal to regular price'
    });
  }

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'At least one product image is required' });
  }

  const validatedImages = [];
  for (const img of images) {
    const rawUrl = typeof img === 'string' ? img : img.image_url;
    if (!rawUrl || !rawUrl.trim()) continue;
    try {
      new URL(rawUrl.trim());
    } catch {
      return res.status(400).json({ error: `Invalid image URL: ${rawUrl}` });
    }
    validatedImages.push({
      image_url: rawUrl.trim(),
      display_order: typeof img === 'object' && img.display_order ? parseInt(img.display_order) : validatedImages.length + 1
    });
  }

  if (validatedImages.length === 0) {
    return res.status(400).json({ error: 'At least one valid product image URL is required' });
  }

  let validatedVideo = null;
  if (video_url && String(video_url).trim()) {
    const v = String(video_url).trim();
    try {
      new URL(v);
      validatedVideo = v;
    } catch {
      return res.status(400).json({ error: `Invalid video URL: ${v}` });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if category exists
    const categoryExists = await client.query(
      'SELECT id FROM categories WHERE id = $1',
      [category_id]
    );
    if (categoryExists.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(400).json({ error: 'Category not found' });
    }

    const result = await client.query(
      `INSERT INTO products (name, description, category_id, regular_price, selling_price, discount, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name.trim(), description || null, category_id, regular_price, selling_price, discount || 0, validatedVideo]
    );

    const product = result.rows[0];
    const savedImages = [];

    for (const img of validatedImages) {
      const imgRes = await client.query(
        `INSERT INTO product_images (product_id, image_url, display_order)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [product.id, img.image_url, img.display_order]
      );
      savedImages.push(imgRes.rows[0]);
    }

    const variantResult = await saveProductVariants(client, product.id, variants).catch((err) => {
      throw err;
    });

    await client.query('COMMIT');
    client.release();

    res.status(201).json({
      message: 'Product created successfully',
      product,
      images: savedImages,
      warnings: variantResult.warnings
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('Create product error:', error);
    if (error.validationErrors) {
      return res.status(400).json({ errors: error.validationErrors });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { name, description, category_id, regular_price, selling_price, discount, images, video_url, variants } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if product exists
    const productExists = await client.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    if (productExists.rows.length === 0) {
      await client.query('ROLLBACK');
      client.release();
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if category exists (if category_id is provided)
    if (category_id) {
      const categoryExists = await client.query(
        'SELECT id FROM categories WHERE id = $1',
        [category_id]
      );
      if (categoryExists.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'Category not found' });
      }
    }

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount++}`);
      values.push(description);
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount++}`);
      values.push(category_id);
    }
    if (regular_price !== undefined) {
      if (parseFloat(regular_price) <= 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'Regular price must be greater than 0' });
      }
      updates.push(`regular_price = $${paramCount++}`);
      values.push(regular_price);
    }
    if (selling_price !== undefined) {
      if (parseFloat(selling_price) <= 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'Selling price must be greater than 0' });
      }
      updates.push(`selling_price = $${paramCount++}`);
      values.push(selling_price);
    }
    if (discount !== undefined) {
      updates.push(`discount = $${paramCount++}`);
      values.push(discount);
    }
    if (video_url !== undefined) {
      updates.push(`video_url = $${paramCount++}`);
      values.push(video_url && String(video_url).trim() ? String(video_url).trim() : null);
    }

    let product = null;

    if (updates.length > 0) {
      updates.push(`updated_at = $${paramCount++}`);
      values.push(new Date());
      values.push(id);

      const query = `
        UPDATE products
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await client.query(query, values);
      product = result.rows[0];

      // Business rule validation
      if (parseFloat(product.selling_price) > parseFloat(product.regular_price)) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({
          error: 'Selling price cannot be greater than regular price',
          warning: 'Selling price should be less than or equal to regular price',
          product
        });
      }
    }

    // Handle image URL replacement
    if (images !== undefined) {
      if (!Array.isArray(images) || images.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'At least one product image is required' });
      }

      const validatedImages = [];
      for (const img of images) {
        const rawUrl = typeof img === 'string' ? img : img.image_url;
        if (!rawUrl || !rawUrl.trim()) continue;
        try {
          new URL(rawUrl.trim());
        } catch {
          await client.query('ROLLBACK');
          client.release();
          return res.status(400).json({ error: `Invalid image URL: ${rawUrl}` });
        }
        validatedImages.push({
          image_url: rawUrl.trim(),
          display_order: typeof img === 'object' && img.display_order ? parseInt(img.display_order) : validatedImages.length + 1
        });
      }

      if (validatedImages.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return res.status(400).json({ error: 'At least one valid product image URL is required' });
      }

      await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);

      for (const img of validatedImages) {
        await client.query(
          `INSERT INTO product_images (product_id, image_url, display_order)
           VALUES ($1, $2, $3)`,
          [id, img.image_url, img.display_order]
        );
      }
    }

    // Handle variants if provided
    let variantWarnings = [];
    if (variants !== undefined) {
      const variantResult = await saveProductVariants(client, id, variants).catch((err) => {
        throw err;
      });
      variantWarnings = variantResult.warnings;
    }

    await client.query('COMMIT');
    client.release();

    if (!product) {
      const productResult = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
      product = productResult.rows[0];
    }

    res.json({
      message: 'Product updated successfully',
      product,
      warnings: variantWarnings
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    client.release();
    console.error('Update product error:', error);
    if (error.validationErrors) {
      return res.status(400).json({ errors: error.validationErrors });
    }
    res.status(500).json({ error: 'Failed to update product' });
  }
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if product exists
    const productExists = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    if (productExists.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete associated images and files
    const images = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = $1',
      [id]
    );

    for (const image of images.rows) {
      if (image.image_url) {
        const imagePath = image.image_url.replace('/uploads/', '');
        await deleteFile(imagePath);
      }
    }

    // Delete product (cascading will handle variants and images)
    await pool.query('DELETE FROM products WHERE id = $1', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
};

const updateProductStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined) {
    return res.status(400).json({ error: 'is_active status is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET is_active = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [is_active, new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      message: 'Product status updated successfully',
      product: result.rows[0]
    });
  } catch (error) {
    console.error('Update product status error:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
};

const uploadProductImages = async (req, res) => {
  const { id } = req.params;

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No image files provided' });
  }

  try {
    // Check if product exists
    const productExists = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    if (productExists.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const uploadedImages = [];
    const maxDisplayOrder = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM product_images WHERE product_id = $1',
      [id]
    );
    let nextDisplayOrder = parseInt(maxDisplayOrder.rows[0].max_order) + 1;

    for (const file of req.files) {
      const imageUrl = getFileUrl(file.filename, 'products');

      const result = await pool.query(
        `INSERT INTO product_images (product_id, image_url, display_order)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [id, imageUrl, nextDisplayOrder++]
      );

      uploadedImages.push(result.rows[0]);
    }

    res.json({
      message: 'Product images uploaded successfully',
      images: uploadedImages
    });
  } catch (error) {
    console.error('Upload product images error:', error);
    res.status(500).json({ error: 'Failed to upload product images' });
  }
};

const deleteProductImage = async (req, res) => {
  const { id, imageId } = req.params;

  try {
    // Check if image exists and belongs to product
    const imageExists = await pool.query(
      'SELECT id, image_url FROM product_images WHERE id = $1 AND product_id = $2',
      [imageId, id]
    );
    if (imageExists.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = imageExists.rows[0];

    // Delete file from storage
    if (image.image_url) {
      const imagePath = image.image_url.replace('/uploads/', '');
      await deleteFile(imagePath);
    }

    // Delete from database
    await pool.query('DELETE FROM product_images WHERE id = $1', [imageId]);

    res.json({ message: 'Product image deleted successfully' });
  } catch (error) {
    console.error('Delete product image error:', error);
    res.status(500).json({ error: 'Failed to delete product image' });
  }
};

const reorderProductImages = async (req, res) => {
  const { id } = req.params;
  const { image_orders } = req.body; // Array of {image_id, display_order}

  if (!Array.isArray(image_orders) || image_orders.length === 0) {
    return res.status(400).json({ error: 'image_orders array is required' });
  }

  try {
    // Check if product exists
    const productExists = await pool.query(
      'SELECT id FROM products WHERE id = $1',
      [id]
    );
    if (productExists.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update display order for each image
    for (const { image_id, display_order } of image_orders) {
      await pool.query(
        `UPDATE product_images
         SET display_order = $1, updated_at = $2
         WHERE id = $3 AND product_id = $4`,
        [display_order, new Date(), image_id, id]
      );
    }

    res.json({ message: 'Product images reordered successfully' });
  } catch (error) {
    console.error('Reorder product images error:', error);
    res.status(500).json({ error: 'Failed to reorder product images' });
  }
};

const getAllProducts = async (req, res) => {
  const { category_id, is_active, page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.*,
             c.name as category_name,
             COALESCE(COUNT(DISTINCT pv.id), 0) as variant_count,
             COALESCE(COUNT(DISTINCT pi.id), 0) as image_count,
             (SELECT image_url FROM product_images pi2 WHERE pi2.product_id = p.id ORDER BY pi2.display_order LIMIT 1) as main_image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_variants pv ON p.id = pv.product_id
      LEFT JOIN product_images pi ON p.id = pi.product_id
    `;

    const conditions = [];
    const values = [];
    let paramCount = 1;

    if (category_id) {
      conditions.push(`p.category_id = $${paramCount++}`);
      values.push(category_id);
    }

    if (is_active !== undefined) {
      conditions.push(`p.is_active = $${paramCount++}`);
      values.push(is_active === 'true');
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY p.id, c.name
      ORDER BY p.created_at DESC
      LIMIT $${paramCount++} OFFSET $${paramCount++}
    `;

    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get total count
    let countQuery = `SELECT COUNT(DISTINCT p.id) as total FROM products p`;
    const countValues = [];

    if (category_id) {
      countQuery += ` WHERE p.category_id = $1`;
      countValues.push(category_id);
    }

    if (is_active !== undefined) {
      if (category_id) {
        countQuery += ` AND p.is_active = $2`;
        countValues.push(is_active === 'true');
      } else {
        countQuery += ` WHERE p.is_active = $1`;
        countValues.push(is_active === 'true');
      }
    }

    const countResult = await pool.query(countQuery, countValues);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get all products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
};

const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get product images
    const images = await pool.query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY display_order`,
      [id]
    );

    // Get product variants
    const variants = await pool.query(
      `SELECT * FROM product_variants WHERE product_id = $1`,
      [id]
    );

    res.json({
      product: result.rows[0],
      images: images.rows,
      variants: variants.rows
    });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStatus,
  uploadProductImages,
  deleteProductImage,
  reorderProductImages,
  getAllProducts,
  getProductById
};