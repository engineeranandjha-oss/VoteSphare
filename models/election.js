import { DataTypes } from 'sequelize';

export default function defineElection(sequelize) {
  const Election = sequelize.define(
    'Election',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      orgId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'scheduled', 'live', 'ended', 'published'),
        defaultValue: 'draft',
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      config: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'elections',
      indexes: [
        { fields: ['orgId'] },
        { fields: ['status'] },
        { fields: ['createdBy'] },
      ],
    }
  );

  return Election;
}
