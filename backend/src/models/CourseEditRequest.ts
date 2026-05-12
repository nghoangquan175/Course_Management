import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

export enum EditRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

class CourseEditRequest extends Model {
  public id!: string;
  public courseId!: string;
  public instructorId!: string;
  public reason!: string;
  public status!: EditRequestStatus;
  public adminNote!: string | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CourseEditRequest.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EditRequestStatus)),
      defaultValue: EditRequestStatus.PENDING,
    },
    adminNote: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'CourseEditRequest',
    tableName: 'course_edit_requests',
    timestamps: true,
  }
);

export default CourseEditRequest;
