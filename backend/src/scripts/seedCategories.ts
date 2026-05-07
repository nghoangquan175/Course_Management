import sequelize from '../config/db';
import Category from '../models/Category';

const categories = [
  'Web Development',
  'Mobile Development',
  'Data Science',
  'UI/UX Design',
  'Digital Marketing',
  'Graphic Design',
  'Business Management',
  'Personal Development',
  'Photography & Video',
  'Cyber Security'
];

const seedCategories = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');

    for (const name of categories) {
      const [category, created] = await Category.findOrCreate({
        where: { name }
      });
      if (created) {
        console.log(`Created category: ${name}`);
      } else {
        console.log(`Category already exists: ${name}`);
      }
    }

    console.log('Seeding categories completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedCategories();
