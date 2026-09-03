import { DataTypes } from 'sequelize';

export default function defineMember(sequelize) {
  const Member = sequelize.define(
    'Member',
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
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
      ],
    }
  );

  return Member;
}
