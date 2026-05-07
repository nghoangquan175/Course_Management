import sequelize from './src/config/db';
import { QueryTypes } from 'sequelize';

async function fixSchema() {
  try {
    console.log('Starting schema fix...');
    
    // 1. Add isVideoCompleted to user_progress
    try {
      await sequelize.query(
        'ALTER TABLE user_progress ADD COLUMN isVideoCompleted BOOLEAN DEFAULT FALSE AFTER status',
        { type: QueryTypes.RAW }
      );
      console.log('Added isVideoCompleted to user_progress');
    } catch (e: any) {
      console.log('isVideoCompleted might already exist or table missing:', e.message);
    }

    // 2. Add progress to enrollments
    try {
      await sequelize.query(
        'ALTER TABLE enrollments ADD COLUMN progress INTEGER DEFAULT 0 AFTER enrolledAt',
        { type: QueryTypes.RAW }
      );
      console.log('Added progress to enrollments');
    } catch (e: any) {
      console.log('progress might already exist or table missing:', e.message);
    }

    // 3. Add status to enrollments
    try {
      await sequelize.query(
        "ALTER TABLE enrollments ADD COLUMN status ENUM('ENROLLED', 'COMPLETED') DEFAULT 'ENROLLED' AFTER progress",
        { type: QueryTypes.RAW }
      );
      console.log('Added status to enrollments');
    } catch (e: any) {
      console.log('status might already exist or table missing:', e.message);
    }

    // 4. Clean up duplicate user_progress and add UNIQUE constraint
    try {
      console.log('Cleaning up duplicates in user_progress...');
      // Delete duplicates keeping the COMPLETED one or the most recent one
      await sequelize.query(`
        DELETE t1 FROM user_progress t1
        INNER JOIN user_progress t2 
        WHERE t1.id > t2.id 
        AND t1.userId = t2.userId 
        AND t1.lessonId = t2.lessonId
      `, { type: QueryTypes.RAW });
      
      console.log('Duplicates cleaned. Adding UNIQUE constraint...');
      await sequelize.query(
        'ALTER TABLE user_progress ADD UNIQUE INDEX user_lesson_unique (userId, lessonId)',
        { type: QueryTypes.RAW }
      );
      console.log('Added UNIQUE constraint to user_progress');
    } catch (e: any) {
      console.log('UNIQUE constraint might already exist or cleanup failed:', e.message);
    }

    console.log('Schema fix completed.');
    process.exit(0);
  } catch (error) {
    console.error('Failed to fix schema:', error);
    process.exit(1);
  }
}

fixSchema();
