exports.up = (pgm) => {
  pgm.addColumns('orders', {
    offer_id: {
      type: 'integer',
      references: 'offers(id)',
      onDelete: 'SET NULL'
    },
    offer_discount: {
      type: 'decimal(10,2)',
      notNull: true,
      default: 0
    }
  });

  pgm.createIndex('orders', 'offer_id');
};

exports.down = (pgm) => {
  pgm.dropIndex('orders', 'offer_id');
  pgm.dropColumns('orders', ['offer_id', 'offer_discount']);
};
