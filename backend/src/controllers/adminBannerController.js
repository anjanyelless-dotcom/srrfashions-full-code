require('dotenv-flow/config');
const pool = require('../config/database');
const { deleteFile, getFileUrl } = require('../storage/storageAdapter');

const VALID_BANNER_TYPES = ['HOME', 'OFFER'];

const getBanners = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  try {
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT * FROM banners
       ORDER BY banner_type, display_order, created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM banners');
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    res.json({
      banners: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Get banners error:', error);
    res.status(500).json({ error: 'Failed to fetch banners' });
  }
};

const createBanner = async (req, res) => {
  const { link_url, banner_type, display_order = 0 } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Banner image is required' });
  }

  if (!banner_type || !VALID_BANNER_TYPES.includes(banner_type)) {
    return res.status(400).json({
      error: 'Invalid banner type. Must be HOME or OFFER'
    });
  }

  try {
    const imageUrl = getFileUrl(req.file.filename, 'banners');

    const result = await pool.query(
      `INSERT INTO banners (image_url, link_url, banner_type, display_order, is_active)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [imageUrl, link_url || null, banner_type, parseInt(display_order) || 0, true]
    );

    res.status(201).json({
      message: 'Banner created successfully',
      banner: result.rows[0]
    });
  } catch (error) {
    console.error('Create banner error:', error);
    res.status(500).json({ error: 'Failed to create banner' });
  }
};

const updateBanner = async (req, res) => {
  const { id } = req.params;
  const { link_url, banner_type, display_order } = req.body;

  if (banner_type && !VALID_BANNER_TYPES.includes(banner_type)) {
    return res.status(400).json({
      error: 'Invalid banner type. Must be HOME or OFFER'
    });
  }

  try {
    const existingBanner = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );

    if (existingBanner.rows.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    const banner = existingBanner.rows[0];
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (req.file) {
      const imageUrl = getFileUrl(req.file.filename, 'banners');
      updates.push(`image_url = $${paramCount++}`);
      values.push(imageUrl);

      // Delete old image
      if (banner.image_url) {
        const oldPath = banner.image_url.replace('/uploads/', '');
        await deleteFile(oldPath);
      }
    }

    if (link_url !== undefined) {
      updates.push(`link_url = $${paramCount++}`);
      values.push(link_url || null);
    }

    if (banner_type !== undefined) {
      updates.push(`banner_type = $${paramCount++}`);
      values.push(banner_type);
    }

    if (display_order !== undefined) {
      updates.push(`display_order = $${paramCount++}`);
      values.push(parseInt(display_order) || 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = $${paramCount++}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE banners
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    res.json({
      message: 'Banner updated successfully',
      banner: result.rows[0]
    });
  } catch (error) {
    console.error('Update banner error:', error);
    res.status(500).json({ error: 'Failed to update banner' });
  }
};

const deleteBanner = async (req, res) => {
  const { id } = req.params;

  try {
    const banner = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );

    if (banner.rows.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    // Delete image file
    if (banner.rows[0].image_url) {
      const imagePath = banner.rows[0].image_url.replace('/uploads/', '');
      await deleteFile(imagePath);
    }

    await pool.query('DELETE FROM banners WHERE id = $1', [id]);

    res.json({ message: 'Banner deleted successfully' });
  } catch (error) {
    console.error('Delete banner error:', error);
    res.status(500).json({ error: 'Failed to delete banner' });
  }
};

const updateBannerStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (is_active === undefined || typeof is_active !== 'boolean') {
    return res.status(400).json({ error: 'is_active boolean is required' });
  }

  try {
    const result = await pool.query(
      `UPDATE banners
       SET is_active = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [is_active, new Date(), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Banner not found' });
    }

    res.json({
      message: 'Banner status updated successfully',
      banner: result.rows[0]
    });
  } catch (error) {
    console.error('Update banner status error:', error);
    res.status(500).json({ error: 'Failed to update banner status' });
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  updateBannerStatus
};
