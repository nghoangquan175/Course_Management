import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

class UserProgress extends Model {
  public id!: string;
  public userId!: string;
  public courseId!: string;
  public lessonId!: string;
  public isVideoCompleted!: boolean;
  public status!: ProgressStatus;
  public lastWatchedSecond!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

UserProgress.init(
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
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(ProgressStatus)),
      defaultValue: ProgressStatus.NOT_STARTED,
    },
    isVideoCompleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastWatchedSecond: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'UserProgress',
    tableName: 'user_progress',
    timestamps: true,
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'lessonId'],
      },
    ],
  }
);

export default UserProgress;
