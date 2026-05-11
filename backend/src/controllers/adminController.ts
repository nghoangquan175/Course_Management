import { Request, Response } from 'express';
import { User, Course, InstructorApplication, Enrollment } from '../models';
import { Op } from 'sequelize';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    // 1. Basic Stats
    const totalUsers = await User.count();
    const activeCourses = await Course.count({ where: { status: 'PUBLISHED' } });
    const pendingApplications = await InstructorApplication.count({ where: { status: 'PENDING' } });
    const pendingCourses = await Course.count({ where: { status: 'PENDING' } });
    const totalEnrollments = await Enrollment.count();

    // 2. Recent Activity
    const [recentUsers, recentCourses, recentApps] = await Promise.all([
      User.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
      Course.findAll({
        limit: 5,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'instructor', attributes: ['name'] }],
      }),
      InstructorApplication.findAll({ limit: 5, order: [['createdAt', 'DESC']] }),
    ]);

    const activities = [
      ...recentUsers.map((u) => ({
        id: `user-${u.id}`,
        type: 'USER_REGISTERED',
        title: `New user registered: ${u.name}`,
        time: u.createdAt,
        status: 'new',
      })),
      ...recentCourses.map((c) => ({
        id: `course-${c.id}`,
        type: 'COURSE_CREATED',
        title: `New course created: ${c.name}`,
        subtitle: `by ${(c as any).instructor?.name || 'Unknown'}`,
        time: c.createdAt,
        status: c.status,
      })),
      ...recentApps.map((a) => ({
        id: `app-${a.id}`,
        type: 'APPLICATION_SUBMITTED',
        title: `New instructor application: ${a.fullName}`,
        time: a.createdAt,
        status: a.status,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10);

    // 3. Revenue Data (Placeholder for now)
    const monthlyRevenue = 0;
    const revenueTrend = '+0%'; // Logic for trend comparison could be added later

    // Revenue Chart Data (last 6 months - all zeros for now)
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
      const monthIdx = (currentMonthIndex - i + 12) % 12;
      chartData.push({
        name: months[monthIdx],
        revenue: 0,
        enrollments: 0, // Adding enrollments as an alternative metric
      });
    }

    res.status(200).json({
      stats: {
        totalUsers,
        activeCourses,
        totalEnrollments,
        pendingTasks: pendingApplications + pendingCourses,
        monthlyRevenue,
        revenueTrend,
      },
      activities,
      chartData,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'name', 'email', 'role', 'isActivated', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
