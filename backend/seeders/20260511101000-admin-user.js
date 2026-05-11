'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Check if admin already exists to avoid duplicates
    const [existingAdmins] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE email = 'admin@course.edu' LIMIT 1"
    );

    if (existingAdmins.length === 0) {
      return queryInterface.bulkInsert('users', [
        {
          id: crypto.randomUUID(),
          name: 'System Admin',
          email: 'admin@course.edu',
          password: hashedPassword,
          role: 'ADMIN',
          isActivated: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.bulkDelete('users', { email: 'admin@course.edu' }, {});
  },
};
