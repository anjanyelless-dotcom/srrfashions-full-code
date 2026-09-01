exports.up = (pgm) => {
  pgm.createTable('inventory_stock_logs', {
    id: 'id',
    variant_id: { type: 'integer', notNull: true, references: 'product_variants(id)', onDelete: 'CASCADE' },
    product_id: { type: 'integer', notNull: true, references: 'products(id)', onDelete: 'CASCADE' },
    old_stock: { type: 'integer', notNull: true },
    new_stock: { type: 'integer', notNull: true },
    changed_by_admin_id: { type: 'integer', notNull: true, references: 'users(id)', onDelete: 'SET NULL' },
    change_reason: { type: 'varchar(255)' },
    created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
  });

  pgm.createIndex('inventory_stock_logs', 'variant_id');
  pgm.createIndex('inventory_stock_logs', 'product_id');
  pgm.createIndex('inventory_stock_logs', 'changed_by_admin_id');
};

exports.down = (pgm) => {
  pgm.dropTable('inventory_stock_logs');
};
