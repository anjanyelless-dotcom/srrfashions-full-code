/**
 * Migration: Add country column to addresses table
 */
exports.up = (pgm) => {
  pgm.addColumn('addresses', {
    country: { type: 'varchar(100)', notNull: true, default: 'India' }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('addresses', 'country');
};
