import { Request, Response } from 'express';
import { Enrollment, Course, User } from '../models';
import { Op } from 'sequelize';

export const getInstructorStudents = async (req: Request, res: Response) => {
  try {
    const instructorId = (req.user as any).id;

    // Find all unique students enrolled in courses of this instructor
    const enrollments = await Enrollment.findAll({
      include: [
        {
          model: Course,
          as: 'course',
          where: { instructorId },
          attributes: [], // We don't need course data, just the filter
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'role', 'isActivated', 'createdAt'],
        },
      ],
    });

    // Extract unique users
    const uniqueUsersMap = new Map();
    enrollments.forEach((enrollment: any) => {
      if (enrollment.user) {
        uniqueUsersMap.set(enrollment.user.id, enrollment.user);
      }
    });

    const students = Array.from(uniqueUsersMap.values());

    res.json(students);
  } catch (error) {
    console.error('Error fetching instructor students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
