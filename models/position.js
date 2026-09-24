import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function definePosition(sequelize) {
  const Position = sequelize.define(
    'Position',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      electionId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      tableName: 'positions',
      indexes: [
        { fields: ['electionId'] },
        { fields: ['order'] },
      ],
    }
  );

  return Position;
}
