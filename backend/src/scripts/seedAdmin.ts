import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import User, { UserRole } from '../models/User';
import { connectDB } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    // 1. Create database if not exists
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
    });
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database ${process.env.DB_NAME} ensured.`);
    await connection.end();

    // 2. Connect via Sequelize
    await connectDB();
    
    // 3. Sync models (create tables)
    const sequelize = (await import('../config/db')).default;
    await sequelize.sync({ alter: true });

    // 4. Check and seed
    const adminExists = await User.findOne({ where: { role: UserRole.ADMIN } });
    
    if (adminExists) {
      console.log('Admin already exists');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await User.create({
      name: 'System Administrator',
      email: 'admin@course.edu',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActivated: true,
    });

    console.log('Admin user seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
