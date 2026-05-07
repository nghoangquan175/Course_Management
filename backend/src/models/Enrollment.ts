import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

class Enrollment extends Model {
  public id!: string;
  public userId!: string;
  public courseId!: string;
  public enrolledAt!: Date;
  public progress!: number;
  public status!: 'ENROLLED' | 'COMPLETED';
  public readonly course?: any;
  public readonly deletedAt!: Date;
}

Enrollment.init(
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
    enrolledAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    progress: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('ENROLLED', 'COMPLETED'),
      defaultValue: 'ENROLLED',
    },
  },
  {
    sequelize,
    modelName: 'Enrollment',
    tableName: 'enrollments',
    timestamps: false,
    paranoid: true,
  }
);

export default Enrollment;
