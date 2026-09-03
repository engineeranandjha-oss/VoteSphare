import { DataTypes } from 'sequelize';

export default function defineCandidate(sequelize) {
  const Candidate = sequelize.define(
    'Candidate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      positionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      photo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      manifesto: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      socialLinks: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      status: {
        type: DataTypes.ENUM('active', 'withdrawn'),
        defaultValue: 'active',
        allowNull: false,
      },
    },
    {
      tableName: 'candidates',
      indexes: [
        { fields: ['positionId'] },
        { fields: ['userId'] },
        { fields: ['status'] },
      ],
    }
  );

  return Candidate;
}
