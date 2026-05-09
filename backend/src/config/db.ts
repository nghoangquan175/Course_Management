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
      idle: 10000,
    },
  }
);

export const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('MySQL Database connected successfully to:', process.env.DB_NAME);
      return;
    } catch (error) {
      retries -= 1;
      console.error(
        `Unable to connect to the database (Attempts left: ${retries}):`,
        (error as any).message
      );
      if (retries === 0) {
        process.exit(1);
      }
      console.log('Retrying in 5 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
};

export default sequelize;
