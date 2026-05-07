import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

class Lesson extends Model {
  public id!: string;
  public courseId!: string;
  public title!: string;
  public order!: number;
  public videoUrl!: string | null;
  public textContent!: string | null;
  public videoDuration!: number | null;
  public readonly course?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Lesson.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    courseId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    videoUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    textContent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    videoDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Lesson',
    paranoid: true,
  }
);

export default Lesson;
