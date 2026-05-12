import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

export enum CourseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  CONTENT_APPROVED = 'CONTENT_APPROVED',
  PUBLISHED = 'PUBLISHED',
  UNPUBLISHED = 'UNPUBLISHED',
}

class Course extends Model {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string;
  public thumbnailUrl!: string;
  public categoryId!: string;
  public instructorId!: string;
  public status!: CourseStatus;
  declare version: number;
  declare parentCourseId: string | null;
  public isLatest!: boolean;
  public totalStudents!: number;
  public rating!: number;
  public lessonCount!: number;
  public readonly lessons?: any[];
  public readonly instructor?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Course.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    thumbnailUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    instructorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(CourseStatus)),
      defaultValue: CourseStatus.DRAFT,
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    parentCourseId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'courses',
        key: 'id',
      },
    },
    isLatest: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    totalStudents: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rating: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    lessonCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Course',
    tableName: 'courses',
    timestamps: true,
    paranoid: true,
  }
);

export default Course;
