import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import Course, { CourseStatus } from '../models/Course';
import Category from '../models/Category';
import Lesson from '../models/Lesson';
import Attachment from '../models/Attachment';
import User, { UserRole } from '../models/User';
import Enrollment from '../models/Enrollment';
import Review from '../models/Review';
import Exam from '../models/Exam';
import UserProgress, { ProgressStatus } from '../models/UserProgress';
import { slugify } from '../utils/slugify';
import ExamResult from '../models/ExamResult';
import Certificate from '../models/Certificate';
import Notification, { NotificationType } from '../models/Notification';
import { sendNotification } from '../utils/socket';

export const createCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, thumbnailUrl, categoryId } = req.body;
    const instructorId = req.user?.id;

    if (!instructorId) {
      return res.status(401).json({ message: 'Instructor ID not found in token' });
    }

    const slug = `${slugify(name)}-${Date.now()}`;

    const course = await Course.create({
      name,
      slug,
      description,
      thumbnailUrl,
      categoryId,
      instructorId,
      status: 'DRAFT',
    });

    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

export const getAllCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, categoryId } = req.query;
    const where: any = {};
    let paranoid = true;

    if (status) {
      if (status === 'DELETED') {
        paranoid = false;
        where.deletedAt = { [Op.ne]: null };
      } else {
        where.status = status;
      }
    }

    if (categoryId) where.categoryId = categoryId;

    if (req.user?.role === 'INSTRUCTOR') {
      // Instructors only see their own courses
      where.instructorId = req.user.id;
    } else if (req.user?.role === 'ADMIN') {
      // Admins see:
      // 1. All non-DRAFT courses from everyone
      // 2. ONLY their own DRAFT courses
      if (status === 'DRAFT') {
        where.instructorId = req.user.id;
      } else if (!status || status === 'all') {
        where[Op.or] = [
          { status: { [Op.ne]: 'DRAFT' } },
          { [Op.and]: [{ status: 'DRAFT' }, { instructorId: req.user.id }] },
        ];
      }
    } else {
      // For GUESTS or STUDENTS, they only see PUBLISHED courses by default
      // unless a specific public status is requested (but even then, we restrict to safe ones)
      if (status && ['PUBLISHED', 'UNPUBLISHED'].includes(status as string)) {
        where.status = status;
      } else {
        where.status = 'PUBLISHED';
      }
    }

    const courses = await Course.findAll({
      where,
      paranoid,
      include: [
        { model: Category, as: 'category', attributes: ['id', 'name'] },
        { model: User, as: 'instructor', attributes: ['id', 'name'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(courses);
  } catch (error) {
    next(error);
  }
};

export const getCourseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { type } = req.query;
    const isOutline = type === 'outline';

    const course = await Course.findByPk(id as string, {
      include: [
        { model: Category, as: 'category' },
        {
          model: Lesson,
          as: 'lessons',
          attributes: isOutline ? { exclude: ['videoUrl', 'content'] } : undefined,
          include: [
            { model: Attachment, as: 'attachments' },
            { model: Exam, as: 'exam', attributes: ['id', 'title', 'passingScore'] },
          ],
        },
        { model: User, as: 'instructor', attributes: ['id', 'name'] },
        {
          model: Review,
          as: 'reviews',
          include: [{ model: User, as: 'user', attributes: ['id', 'name'] }],
        },
      ],
    });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Protection: Instructor can only see their own courses
    if (req.user?.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to view this course' });
    }

    // Attach user enrollment if logged in
    const userId = req.user?.id;
    let userEnrollment = null;
    if (userId) {
      userEnrollment = await Enrollment.findOne({
        where: { userId, courseId: id },
      });
    }

    const courseData = course.toJSON();

    // Attach highest score per lesson if logged in
    if (userId && courseData.lessons) {
      const examIds = courseData.lessons.filter((l: any) => l.exam).map((l: any) => l.exam.id);

      const highScoreMap = new Map();

      if (examIds.length > 0) {
        const allResults = await ExamResult.findAll({
          where: { userId, examId: { [Op.in]: examIds } },
        });

        allResults.forEach((r) => {
          const current = highScoreMap.get(r.examId) || 0;
          if (r.score > current) highScoreMap.set(r.examId, r.score);
        });
      }

      courseData.lessons = courseData.lessons.map((l: any) => {
        const examId = l.exam?.id;
        return {
          ...l,
          highestScore: examId ? (highScoreMap.get(examId) ?? null) : null,
        };
      });
    }

    if (userEnrollment) {
      const enrollmentData = userEnrollment.toJSON();
      if (enrollmentData.status === 'COMPLETED') {
        const cert = await Certificate.findOne({ where: { userId, courseId: id } });
        if (cert) enrollmentData.certificateUrl = cert.pdfUrl;
      }
      courseData.userEnrollment = enrollmentData;
    } else {
      courseData.userEnrollment = null;
    }

    res.status(200).json(courseData);
  } catch (error) {
    next(error);
  }
};

export const updateCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, thumbnailUrl, categoryId, status } = req.body;

    const course = await Course.findByPk(id as string);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Protection: Instructor can only update their own courses
    if (req.user?.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to update this course' });
    }

    if (name) {
      course.name = name;
      course.slug = `${slugify(name)}-${Date.now()}`;
    }
    if (description) course.description = description;
    if (thumbnailUrl) course.thumbnailUrl = thumbnailUrl;
    if (categoryId) course.categoryId = categoryId;
    if (status) course.status = status;

    await course.save();

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const deleteCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Protection: Instructor can only delete their own courses
    if (req.user?.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to delete this course' });
    }

    await course.destroy(); // Paranoid is true, so it will be a soft delete

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const restoreCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // Must use paranoid: false to find a deleted record
    const course = await Course.findByPk(id as string, { paranoid: false });

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Protection: Instructor can only restore their own courses
    if (req.user?.role === 'INSTRUCTOR' && course.instructorId !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to restore this course' });
    }

    await course.restore();

    res.status(200).json({ message: 'Course restored successfully' });
  } catch (error) {
    next(error);
  }
};

// --- Workflow Transitions ---

export const submitForApproval = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.instructorId !== req.user?.id) {
      return res
        .status(403)
        .json({ message: 'Unauthorized: Only the instructor of this course can submit it' });
    }

    if (course.status !== CourseStatus.DRAFT) {
      return res.status(400).json({ message: 'Only DRAFT courses can be submitted' });
    }

    course.status = CourseStatus.PENDING;
    await course.save();

    // Notify Admins
    const admins = await User.findAll({ where: { role: UserRole.ADMIN } });
    await Promise.all(
      admins.map(async (admin) => {
        const notif = await Notification.create({
          userId: admin.id,
          targetRole: UserRole.ADMIN,
          title: 'New Course Submitted',
          message: `Course "${course.name}" has been submitted for approval.`,
          type: NotificationType.COURSE_SUBMITTED,
          referenceId: course.id,
        });
        sendNotification(admin.id, notif);
      })
    );

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const withdrawCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }
    if (course.status !== CourseStatus.PENDING) {
      return res.status(400).json({ message: 'Only PENDING courses can be withdrawn' });
    }
    course.status = CourseStatus.DRAFT;
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const approveCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.status !== CourseStatus.PENDING) {
      return res.status(400).json({ message: 'Only PENDING courses can be approved' });
    }
    course.status = CourseStatus.CONTENT_APPROVED;
    await course.save();

    // Notify Instructor
    const notif = await Notification.create({
      userId: course.instructorId,
      targetRole: UserRole.INSTRUCTOR,
      title: 'Course Approved',
      message: `Your course "${course.name}" has been approved.`,
      type: NotificationType.COURSE_APPROVED,
      referenceId: course.id,
    });
    sendNotification(course.instructorId, notif);

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const rejectCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.status !== CourseStatus.PENDING) {
      return res.status(400).json({ message: 'Only PENDING courses can be rejected' });
    }
    course.status = CourseStatus.DRAFT; // Back to draft for fixes
    await course.save();

    // Notify Instructor
    const notif = await Notification.create({
      userId: course.instructorId,
      targetRole: UserRole.INSTRUCTOR,
      title: 'Course Rejected',
      message: `Your course "${course.name}" has been rejected. Please check and update.`,
      type: NotificationType.COURSE_REJECTED,
      referenceId: course.id,
    });
    sendNotification(course.instructorId, notif);

    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const publishCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (
      course.status !== CourseStatus.CONTENT_APPROVED &&
      course.status !== CourseStatus.UNPUBLISHED
    ) {
      return res.status(400).json({ message: 'Course must be approved or unpublished' });
    }
    course.status = CourseStatus.PUBLISHED;
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const unpublishCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.status !== CourseStatus.PUBLISHED) {
      return res.status(400).json({ message: 'Only PUBLISHED courses can be unpublished' });
    }
    course.status = CourseStatus.UNPUBLISHED;
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};

export const requestEdit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const course = await Course.findByPk(id as string);
    if (!course || course.instructorId !== req.user?.id) {
      return res.status(404).json({ message: 'Course not found or unauthorized' });
    }
    course.status = CourseStatus.DRAFT;
    await course.save();
    res.status(200).json(course);
  } catch (error) {
    next(error);
  }
};
// --- Enrollment ---

export const enrollCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const course = await Course.findByPk(id as string);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      return res.status(400).json({ message: 'Can only enroll in published courses' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      where: { userId, courseId: id },
    });

    if (existingEnrollment) {
      return res.status(200).json({ message: 'Already enrolled', enrollment: existingEnrollment });
    }

    // Create enrollment
    const enrollment = await Enrollment.create({
      userId,
      courseId: id,
      enrolledAt: new Date(),
    });

    // Increment totalStudents
    course.totalStudents = (course.totalStudents || 0) + 1;
    await course.save();

    res.status(201).json({ message: 'Enrolled successfully', enrollment });
  } catch (error) {
    next(error);
  }
};

export const getEnrolledCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const enrollments = await Enrollment.findAll({
      where: { userId },
      include: [
        {
          model: Course,
          as: 'course',
          include: [
            { model: Category, as: 'category' },
            { model: User, as: 'instructor', attributes: ['id', 'name'] },
            { model: Lesson, as: 'lessons', attributes: ['id', 'videoUrl'] },
          ],
        },
      ],
    });

    if (!enrollments || enrollments.length === 0) {
      return res.status(200).json([]);
    }

    // Optimize: Fetch reviews to check hasReviewed status
    const [allReviews, allCertificates] = await Promise.all([
      Review.findAll({ where: { userId } }),
      Certificate.findAll({ where: { userId } }),
    ]);

    const reviewMap = new Set(allReviews.map((r) => r.courseId));
    const certMap = new Map(allCertificates.map((c) => [c.courseId, c.pdfUrl]));

    const coursesWithProgress = enrollments
      .filter((e) => e.course)
      .map((e) => {
        const course: any = e.course.toJSON();
        course.hasReviewed = reviewMap.has(course.id);
        course.progress = e.progress || 0; // Use persisted progress from DB
        course.status = e.status; // ENROLLED or COMPLETED
        if (e.status === 'COMPLETED') {
          course.certificateUrl = certMap.get(course.id);
        }
        return course;
      });

    res.status(200).json(coursesWithProgress);
  } catch (error) {
    next(error);
  }
};

export const getLessonDetail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findByPk(lessonId as string, {
      include: [
        { model: Attachment, as: 'attachments' },
        {
          model: Exam,
          as: 'exam',
          attributes: ['id', 'title', 'passingScore', 'timeLimit', 'description'],
        },
      ],
    });

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    res.status(200).json(lesson);
  } catch (error) {
    next(error);
  }
};
