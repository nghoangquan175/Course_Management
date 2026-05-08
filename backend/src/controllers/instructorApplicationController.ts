import { Request, Response, NextFunction } from 'express';
import { InstructorApplication, User } from '../models';
import { sendInstructorApprovalEmail, sendInstructorRejectionEmail } from '../services/mailService';
import { UserRole } from '../models/User';
import Notification, { NotificationType } from '../models/Notification';
import { sendNotification } from '../utils/socket';

export const submitApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { fullName, email, phone, bio, cvUrl, age, gender } = req.body;

    // Check if user already has a pending application
    const existingApplication = await InstructorApplication.findOne({
      where: { userId, status: 'PENDING' },
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You already have a pending application.' });
    }

    const application = await InstructorApplication.create({
      userId,
      fullName,
      email,
      phone,
      bio,
      cvUrl,
      age,
      gender,
      status: 'PENDING',
    });

    // Notify Admins
    const admins = await User.findAll({ where: { role: UserRole.ADMIN } });
    await Promise.all(
      admins.map(async (admin) => {
        const notif = await Notification.create({
          userId: admin.id,
          targetRole: UserRole.ADMIN,
          title: 'New Instructor Application',
          message: `User ${fullName} has applied to be an instructor.`,
          type: NotificationType.INSTRUCTOR_APPLICATION,
          referenceId: application.id,
        });
        sendNotification(admin.id, notif);
      })
    );

    res.status(201).json({
      message: 'Application submitted successfully.',
      application,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllApplications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const applications = await InstructorApplication.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
      order: [['createdAt', 'DESC']],
    });

    res.status(200).json(applications);
  } catch (error) {
    next(error);
  }
};

export const getApplicationById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const application = await InstructorApplication.findByPk(id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email'] }],
    });

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
};

export const processApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { status, rejectionReason } = req.body;

    const application = await InstructorApplication.findByPk(id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found.' });
    }

    if (application.status !== 'PENDING') {
      return res.status(400).json({ message: 'This application has already been processed.' });
    }

    if (status === 'APPROVED') {
      // Update application status
      application.status = 'APPROVED';
      await application.save();

      // Update user role
      const user = await User.findByPk(application.userId);
      if (user) {
        user.role = UserRole.INSTRUCTOR;
        await user.save();

        // Send approval email
        await sendInstructorApprovalEmail(user.email, application.fullName);

        // Notify User
        const notif = await Notification.create({
          userId: user.id,
          targetRole: UserRole.USER,
          title: 'Instructor Application Approved',
          message: 'Congratulations! Your application to become an instructor has been approved.',
          type: NotificationType.APPLICATION_APPROVED,
          referenceId: application.id,
        });
        sendNotification(user.id, notif);
      }
    } else if (status === 'REJECTED') {
      if (!rejectionReason) {
        return res.status(400).json({ message: 'Rejection reason is required.' });
      }

      // Update application status
      application.status = 'REJECTED';
      application.rejectionReason = rejectionReason;
      await application.save();

      // Send rejection email
      const user = await User.findByPk(application.userId);
      if (user) {
        await sendInstructorRejectionEmail(user.email, application.fullName, rejectionReason);

        // Notify User
        const notif = await Notification.create({
          userId: user.id,
          targetRole: UserRole.USER,
          title: 'Instructor Application Rejected',
          message: `Your application to become an instructor has been rejected. Reason: ${rejectionReason}`,
          type: NotificationType.APPLICATION_REJECTED,
          referenceId: application.id,
        });
        sendNotification(user.id, notif);
      }
    } else {
      return res.status(400).json({ message: 'Invalid status.' });
    }

    res.status(200).json({
      message: `Application ${status.toLowerCase()} successfully.`,
      application,
    });
  } catch (error) {
    next(error);
  }
};
