exports.up = (pgm) => {
  // Add slug column to products table (nullable initially for safe migration)
  pgm.addColumn('products', {
    slug: { type: 'varchar(255)', notNull: false }
  });

  // Add index on products.slug for faster lookups
  pgm.createIndex('products', 'slug', {
    name: 'idx_products_slug'
  });

  // Add slug column to categories table (nullable initially for safe migration)
  pgm.addColumn('categories', {
    slug: { type: 'varchar(255)', notNull: false }
  });

  // Add index on categories.slug for faster lookups
  pgm.createIndex('categories', 'slug', {
    name: 'idx_categories_slug'
  });

  // Generate slugs for existing products
  // This SQL converts names to URL-friendly slugs:
  // - Lowercase
  // - Replace spaces and special chars with hyphens
  // - Remove consecutive hyphens
  // - Trim leading/trailing hyphens
  pgm.sql(`
    UPDATE products
    SET slug = REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(TRIM(name)),
          '[^a-z0-9\s-]',
          '',
          'g'
        ),
        '[\s]+',
        '-',
        'g'
      ),
      '-+',
      '-',
      'g'
    )
    WHERE slug IS NULL;
  `);

  // Generate slugs for existing categories
  pgm.sql(`
    UPDATE categories
    SET slug = REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          LOWER(TRIM(name)),
          '[^a-z0-9\s-]',
          '',
          'g'
        ),
        '[\s]+',
        '-',
        'g'
      ),
      '-+',
      '-',
      'g'
    )
    WHERE slug IS NULL;
  `);

  // Handle duplicate product slugs by appending ID
  pgm.sql(`
    WITH duplicates AS (
      SELECT slug, COUNT(*) as count
      FROM products
      WHERE slug IS NOT NULL
      GROUP BY slug
      HAVING COUNT(*) > 1
    )
    UPDATE products p
    SET slug = p.slug || '-' || p.id
    FROM duplicates d
    WHERE p.slug = d.slug;
  `);

  // Handle duplicate category slugs by appending ID
  pgm.sql(`
    WITH duplicates AS (
      SELECT slug, COUNT(*) as count
      FROM categories
      WHERE slug IS NOT NULL
      GROUP BY slug
      HAVING COUNT(*) > 1
    )
    UPDATE categories c
    SET slug = c.slug || '-' || c.id
    FROM duplicates d
    WHERE c.slug = d.slug;
  `);

  // Now that all existing records have unique slugs, add unique constraint
  pgm.addConstraint('products', 'products_slug_unique', {
    unique: ['slug']
  });

  pgm.addConstraint('categories', 'categories_slug_unique', {
    unique: ['slug']
  });
};

exports.down = (pgm) => {
  // Remove unique constraints
  pgm.dropConstraint('products', 'products_slug_unique');
  pgm.dropConstraint('categories', 'categories_slug_unique');

  // Remove indexes
  pgm.dropIndex('products', 'idx_products_slug');
  pgm.dropIndex('categories', 'idx_categories_slug');

  // Remove slug columns
  pgm.dropColumn('products', 'slug');
  pgm.dropColumn('categories', 'slug');
};
