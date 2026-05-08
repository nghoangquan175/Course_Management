import { Request, Response, NextFunction } from 'express';
import { Notification, User } from '../models';
import { UserRole } from '../models/User';
import { sendNotification } from '../utils/socket';

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { role } = req.query;

    const notifications = await Notification.findAll({
      where: {
        userId,
        targetRole: role as UserRole,
      },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.status(200).json(notifications);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await Notification.findOne({
      where: { id, userId },
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json(notification);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { role } = req.body;

    await Notification.update(
      { isRead: true },
      {
        where: {
          userId,
          targetRole: role as UserRole,
          isRead: false,
        },
      }
    );

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

export const createAdminNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, message, targetRole, userIds, type, referenceId } = req.body;

    let targetUserIds: string[] = [];

    if (userIds && userIds.length > 0) {
      targetUserIds = userIds;
    } else if (targetRole) {
      // If target is USER, send to everyone (since all are users)
      // If target is INSTRUCTOR or ADMIN, filter specifically
      const whereClause = targetRole === 'USER' ? {} : { role: targetRole };
      const users = await User.findAll({
        where: whereClause,
        attributes: ['id'],
      });
      targetUserIds = users.map((u) => u.id);
    }

    const notifications = await Promise.all(
      targetUserIds.map(async (uid) => {
        const notif = await Notification.create({
          userId: uid,
          targetRole: targetRole || UserRole.USER,
          title,
          message,
          type,
          referenceId,
          isRead: false,
        });

        sendNotification(uid, notif);
        return notif;
      })
    );

    res.status(201).json({ message: `Sent ${notifications.length} notifications` });
  } catch (error) {
    next(error);
  }
};
