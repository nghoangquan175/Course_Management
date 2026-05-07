import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/db';

class Certificate extends Model {
  public id!: string;
  public userId!: string;
  public courseId!: string;
  public pdfUrl!: string;
  public cloudinaryPublicId!: string;
  public certificateCode!: string;
  public studentNameSnap!: string;
  public courseTitleSnap!: string;
  public issuedAt!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Certificate.init(
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
    pdfUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    cloudinaryPublicId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    certificateCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    studentNameSnap: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    courseTitleSnap: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    issuedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: 'Certificate',
    tableName: 'certificates',
    timestamps: true,
  }
);

export default Certificate;
