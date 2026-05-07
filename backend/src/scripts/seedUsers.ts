import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User';
import { connectDB } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();
    const hashedPassword = await bcrypt.hash('pass123', 12);

    const users = [];

    // Create 10 Users
    for (let i = 1; i <= 10; i++) {
      users.push({
        name: `Regular User ${i}`,
        email: `user${i}@test.com`,
        password: hashedPassword,
        role: UserRole.USER,
        isActivated: true,
      });
    }

    // Create 10 Instructors
    for (let i = 1; i <= 10; i++) {
      users.push({
        name: `Instructor ${i}`,
        email: `inst${i}@test.com`,
        password: hashedPassword,
        role: UserRole.INSTRUCTOR,
        isActivated: true,
      });
    }

    await User.bulkCreate(users);

    console.log('Successfully seeded 10 Users and 10 Instructors!');
    console.log('Login examples:');
    console.log('- User: user1@test.com / pass123');
    console.log('- Instructor: inst1@test.com / pass123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
