import { DataTypes } from 'sequelize';

export default function defineAuditLog(sequelize) {
  const AuditLog = sequelize.define(
    'AuditLog',
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
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entityId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
      timestamp: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'audit_logs',
      updatedAt: false, // Audit logs are append-only
      indexes: [
        { fields: ['orgId'] },
        { fields: ['userId'] },
        { fields: ['action'] },
        { fields: ['entityType', 'entityId'] },
      ],
    }
  );

  return AuditLog;
}
