import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

class InstructorApplication extends Model {
  public id!: string;
  public userId!: string;
  public fullName!: string;
  public email!: string;
  public phone!: string;
  public bio!: string;
  public cvUrl!: string;
  public age!: number;
  public gender!: 'MALE' | 'FEMALE' | 'OTHER';
  public status!: 'PENDING' | 'APPROVED' | 'REJECTED';
  public rejectionReason?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

InstructorApplication.init(
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
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    cvUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING',
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'InstructorApplication',
    tableName: 'instructor_applications',
  }
);

export default InstructorApplication;
