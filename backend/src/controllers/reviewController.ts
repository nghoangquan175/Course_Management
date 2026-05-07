import { Request, Response, NextFunction } from 'express';
import Review from '../models/Review';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';
import sequelize from '../config/db';

export const createReview = async (req: Request, res: Response, next: NextFunction) => {
  const transaction = await sequelize.transaction();
  try {
    const { courseId, rating, comment } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // 1. Check if user is enrolled
    const enrollment = await Enrollment.findOne({
      where: { userId, courseId }
    });

    if (!enrollment) {
      await transaction.rollback();
      return res.status(403).json({ message: 'You must be enrolled in this course to leave a review' });
    }

    // 2. Check if user already reviewed
    const existingReview = await Review.findOne({
      where: { userId, courseId }
    });

    if (existingReview) {
      await transaction.rollback();
      return res.status(400).json({ message: 'You have already reviewed this course' });
    }

    // 3. Create review
    const review = await Review.create({
      userId,
      courseId,
      rating,
      comment
    }, { transaction });

    // 4. Update Course Average Rating
    const reviews = await Review.findAll({
      where: { courseId },
      attributes: ['rating'],
      transaction
    });

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Course.update(
      { rating: averageRating },
      { where: { id: courseId }, transaction }
    );

    await transaction.commit();

    res.status(201).json({
      message: 'Review submitted successfully',
      review,
      newAverageRating: averageRating
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

export const getCourseReviews = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId } = req.params;
      const reviews = await Review.findAll({
        where: { courseId },
        order: [['createdAt', 'DESC']]
      });
      res.status(200).json(reviews);
    } catch (error) {
      next(error);
    }
  };
