import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

export enum QuestionType {
  TRUE_FALSE = 'TRUE_FALSE',
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
}

class Question extends Model {
  public id!: string;
  public examId!: string;
  public type!: QuestionType;
  public questionText!: string;
  public options!: any;
  public correctAnswerIndex!: number;
  public explanation!: string;
  public order!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt!: Date;
}

Question.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    examId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(QuestionType)),
      allowNull: false,
    },
    questionText: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSON, // Stores array of strings
      allowNull: false,
    },
    correctAnswerIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    explanation: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Question',
    tableName: 'questions',
    timestamps: true,
    paranoid: true,
  }
);

export default Question;
