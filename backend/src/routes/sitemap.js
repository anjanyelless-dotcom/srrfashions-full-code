require('dotenv-flow/config');
const pool = require('../config/database');

const SITE_URL = 'https://www.srrfashions.in';

async function generateSitemap() {
  try {
    const urls = [];

    // Static pages
    urls.push({ loc: `${SITE_URL}/`, lastmod: null });
    urls.push({ loc: `${SITE_URL}/about-us`, lastmod: null });
    urls.push({ loc: `${SITE_URL}/contact-us`, lastmod: null });

    // Fetch active categories with slugs
    const categoriesResult = await pool.query(`
      SELECT slug, updated_at
      FROM categories
      WHERE is_active = true
        AND slug IS NOT NULL
        AND slug != ''
      ORDER BY name
    `);

    for (const category of categoriesResult.rows) {
      urls.push({
        loc: `${SITE_URL}/category/${category.slug}`,
        lastmod: category.updated_at ? category.updated_at.toISOString().split('T')[0] : null
      });
    }

    // Fetch active products with slugs
    const productsResult = await pool.query(`
      SELECT slug, updated_at
      FROM products
      WHERE is_active = true
        AND slug IS NOT NULL
        AND slug != ''
      ORDER BY name
    `);

    for (const product of productsResult.rows) {
      urls.push({
        loc: `${SITE_URL}/product/${product.slug}`,
        lastmod: product.updated_at ? product.updated_at.toISOString().split('T')[0] : null
      });
    }

    // Generate XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    for (const url of urls) {
      xml += '  <url>\n';
      xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
      if (url.lastmod) {
        xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      }
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    return xml;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    throw error;
  }
}

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const getSitemap = async (req, res) => {
  try {
    const xml = await generateSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    res.status(500).send('Error generating sitemap');
  }
};

module.exports = { getSitemap };
