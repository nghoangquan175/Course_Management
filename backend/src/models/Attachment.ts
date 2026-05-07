import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';
import Lesson from './Lesson';

class Attachment extends Model {
  public id!: string;
  public lessonId!: string;
  public fileName!: string;
  public fileUrl!: string;
  public fileType!: string;
  public fileSize!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Attachment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    lessonId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Attachment',
  }
);

// Associations
Lesson.hasMany(Attachment, { foreignKey: 'lessonId', as: 'attachments' });
Attachment.belongsTo(Lesson, { foreignKey: 'lessonId' });

export default Attachment;
