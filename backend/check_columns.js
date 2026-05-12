const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

async function check() {
  try {
    const [results] = await sequelize.query('DESCRIBE courses');
    const versionCol = results.find((c) => c.Field === 'version');
    console.log('Version column:', versionCol);
    console.log('Total columns:', results.length);
    console.log('Fields:', results.map((r) => r.Field).join(', '));
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

check();
