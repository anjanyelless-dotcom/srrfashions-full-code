exports.up = (pgm) => {
  pgm.addColumn('users', {
    date_of_birth: { type: 'date' }
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('users', 'date_of_birth');
};
