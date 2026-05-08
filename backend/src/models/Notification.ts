import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';
import { UserRole } from './User';

export enum NotificationType {
  SYSTEM = 'SYSTEM',
  COURSE_SUBMITTED = 'COURSE_SUBMITTED',
  COURSE_APPROVED = 'COURSE_APPROVED',
  COURSE_REJECTED = 'COURSE_REJECTED',
  NEW_ENROLLMENT = 'NEW_ENROLLMENT',
  INSTRUCTOR_APPLICATION = 'INSTRUCTOR_APPLICATION',
  APPLICATION_APPROVED = 'APPLICATION_APPROVED',
  APPLICATION_REJECTED = 'APPLICATION_REJECTED',
}

class Notification extends Model {
  public id!: string;
  public userId!: string;
  public targetRole!: UserRole;
  public title!: string;
  public message!: string;
  public type!: NotificationType;
  public referenceId!: string | null;
  public isRead!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Notification.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    targetRole: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NotificationType)),
      defaultValue: NotificationType.SYSTEM,
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
  }
);

export default Notification;
