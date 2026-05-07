import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

class ExamResult extends Model {
  public id!: string;
  public userId!: string;
  public examId!: string;
  public score!: number;
  public isPassed!: boolean;
  public userAnswers!: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ExamResult.init(
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
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    isPassed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userAnswers: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'ExamResult',
    tableName: 'exam_results',
    timestamps: true,
  }
);

export default ExamResult;
