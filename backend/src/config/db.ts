import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('--- DB CONFIG CHECK ---');
console.log('DB_NAME from env:', process.env.DB_NAME);
console.log('-----------------------');

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASS as string,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL Database connected successfully to:', process.env.DB_NAME);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export default sequelize;
