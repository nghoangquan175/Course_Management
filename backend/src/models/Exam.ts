import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

class Exam extends Model {
  public id!: string;
  public lessonId!: string;
  public title!: string;
  public description!: string;
  public passingScore!: number;
  public timeLimit!: number;
  public isPassed!: boolean;
  public readonly questions?: any[];
  public readonly lesson?: any;
  public readonly deletedAt!: Date;
}

Exam.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true, // 1:1 with Lesson
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    passingScore: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
    },
    timeLimit: {
      type: DataTypes.INTEGER, // in minutes
      defaultValue: 0,
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'Exam',
    tableName: 'exams',
    timestamps: true,
    paranoid: true,
  }
);

export default Exam;
