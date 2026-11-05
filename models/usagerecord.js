import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineUsageRecord(sequelize) {
  const UsageRecord = sequelize.define(
    'UsageRecord',
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
      subscriptionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'organization_subscriptions',
          key: 'id',
        },
      },
      electionId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'elections',
          key: 'id',
        },
      },
      usageType: {
        type: DataTypes.ENUM('election_created', 'voter_enrolled', 'email_dispatched'),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      billingPeriodMonth: {
        type: DataTypes.STRING(7), // Format: 'YYYY-MM'
        allowNull: false,
      },
      recordedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'usage_records',
      updatedAt: false,
      indexes: [
        { fields: ['orgId', 'usageType', 'billingPeriodMonth'] },
        { fields: ['electionId'] },
        { fields: ['subscriptionId'] },
      ],
    }
  );

  return UsageRecord;
}

