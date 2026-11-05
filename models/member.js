import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineMember(sequelize) {
  const Member = sequelize.define(
    'Member',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      orgId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      role: {
        type: DataTypes.ENUM('owner', 'admin', 'voter'),
        defaultValue: 'voter',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('active', 'pending', 'suspended'),
        defaultValue: 'active',
        allowNull: false,
      },
      joinedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'members',
      indexes: [
        { unique: true, fields: ['orgId', 'userId'] },
        { fields: ['orgId'] },
        { fields: ['userId'] },
        { fields: ['role'] },
        { fields: ['status'] },
      ],
    }
  );

  return Member;
}
