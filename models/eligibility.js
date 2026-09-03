import { DataTypes } from 'sequelize';

export default function defineEligibility(sequelize) {
  const Eligibility = sequelize.define(
    'Eligibility',
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
      memberId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('eligible', 'voted', 'disqualified'),
        defaultValue: 'eligible',
        allowNull: false,
      },
    },
    {
      tableName: 'eligibility',
      indexes: [
        { unique: true, fields: ['electionId', 'memberId'] },
        { fields: ['electionId'] },
        { fields: ['memberId'] },
        { fields: ['status'] },
      ],
    }
  );

  return Eligibility;
}
