'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Add 'parentCourseId' for lineage tracking
    await queryInterface.addColumn('courses', 'parentCourseId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('courses', 'parentCourseId');
  },
};
