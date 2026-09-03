import { DataTypes } from 'sequelize';

export default function defineVote(sequelize) {
  const Vote = sequelize.define(
    'Vote',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      electionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      positionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      candidateId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      eligibilityId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      isAnonymous: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'votes',
      updatedAt: false, // Votes are immutable once cast
      indexes: [
        { unique: true, fields: ['eligibilityId', 'positionId'] }, // Prevents double voting per position
        { fields: ['electionId'] },
        { fields: ['positionId'] },
        { fields: ['candidateId'] },
        { fields: ['eligibilityId'] },
      ],
    }
  );

  return Vote;
}
