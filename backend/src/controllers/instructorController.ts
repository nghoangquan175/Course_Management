import { Request, Response } from 'express';
import { Enrollment, Course, User, Review, CourseEditRequest, Notification } from '../models';
import { NotificationType } from '../models/Notification';
import { sendNotification } from '../utils/socket';
import { Op } from 'sequelize';

export const getInstructorDashboardStats = async (req: Request, res: Response) => {
  try {
    const instructorId = (req.user as any).id;

    // 1. Basic Stats
    const totalCourses = await Course.count({ where: { instructorId } });
    const activeCourses = await Course.count({
      where: {
        instructorId,
        status: 'PUBLISHED',
      },
    });

    // Get all enrollments for this instructor's courses
    const allEnrollments = await Enrollment.findAll({
      include: [
        {
          model: Course,
          as: 'course',
          where: { instructorId },
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['enrolledAt', 'DESC']],
    });

    const totalEnrollments = allEnrollments.length;

    // Extract unique students
    const uniqueStudentsSet = new Set();
    allEnrollments.forEach((e: any) => {
      if (e.userId) uniqueStudentsSet.add(e.userId);
    });
    const totalStudents = uniqueStudentsSet.size;

    // 2. Recent Enrollments (Top 5)
    const recentEnrollments = allEnrollments.slice(0, 5).map((e: any) => ({
      id: e.id,
      studentName: e.user?.name || 'Unknown',
      courseName: e.course?.name || 'Unknown',
      date: e.enrolledAt,
    }));

    // 3. Recent Reviews (Top 5)
    const recentReviews = await Review.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Course,
          as: 'course',
          where: { instructorId },
          attributes: ['id', 'name'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name'],
        },
      ],
    });

    const mappedReviews = recentReviews.map((r: any) => ({
      id: r.id,
      studentName: r.user?.name || 'Unknown',
      courseName: r.course?.name || 'Unknown',
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    }));

    // 4. Chart Data (Last 6 months enrollments)
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const currentMonthIndex = new Date().getMonth();
    const chartData = [];

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date();
      targetDate.setMonth(currentMonthIndex - i);
      const targetMonth = targetDate.getMonth();
      const targetYear = targetDate.getFullYear();

      const count = allEnrollments.filter((e: any) => {
        const d = new Date(e.enrolledAt);
        return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
      }).length;

      chartData.push({
        name: months[targetMonth],
        enrollments: count,
      });
    }

    res.json({
      stats: {
        totalCourses,
        activeCourses,
        totalStudents,
        totalEnrollments,
      },
      recentEnrollments,
      recentReviews: mappedReviews,
      chartData,
    });
  } catch (error) {
    console.error('Error fetching instructor dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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
export const requestCourseEdit = async (req: Request, res: Response) => {
  try {
    const instructorId = (req.user as any).id;
    const { courseId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    // 1. Check if course belongs to instructor
    const course = await Course.findOne({
      where: { id: courseId, instructorId },
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found or access denied' });
    }

    // 2. Check if there is already a pending request
    const existingRequest = await CourseEditRequest.findOne({
      where: {
        courseId,
        instructorId,
        status: 'PENDING',
      },
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: 'There is already a pending edit request for this course' });
    }

    const request = await CourseEditRequest.create({
      courseId,
      instructorId,
      reason,
      status: 'PENDING',
    });

    // 4. Notify Admins
    const admins = await User.findAll({ where: { role: 'ADMIN' } });
    await Promise.all(
      admins.map(async (admin) => {
        const notif = await Notification.create({
          userId: admin.id,
          targetRole: 'ADMIN',
          title: 'Course Edit Request',
          message: `Instructor ${(req.user as any)?.name || 'Someone'} requested to edit course "${course.name}".`,
          type: NotificationType.COURSE_SUBMITTED, // Reuse COURSE_SUBMITTED or add new type
          referenceId: course.id,
        });
        sendNotification(admin.id, notif);
      })
    );

    res.status(201).json({
      message: 'Edit request submitted successfully',
      request,
    });
  } catch (error) {
    console.error('Error submitting edit request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getInstructorEditRequests = async (req: Request, res: Response) => {
  try {
    const instructorId = (req.user as any).id;

    const requests = await CourseEditRequest.findAll({
      where: { instructorId },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'name', 'version', 'thumbnailUrl'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching edit requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
