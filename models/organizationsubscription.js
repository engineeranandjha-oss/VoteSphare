import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineOrganizationSubscription(sequelize) {
  const OrganizationSubscription = sequelize.define(
    'OrganizationSubscription',
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
      planId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'subscription_plans',
          key: 'id',
        },
      },
      razorpaySubscriptionId: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: true,
      },
      status: {
        type: DataTypes.ENUM(
          'trialing',
          'active',
          'pending',
          'halted',
          'cancelled',
          'completed',
          'expired'
        ),
        defaultValue: 'active',
        allowNull: false,
      },
      billingInterval: {
        type: DataTypes.ENUM('monthly', 'yearly', 'once'),
        defaultValue: 'monthly',
        allowNull: false,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      currentPeriodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      nextBillingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      gracePeriodEnd: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancellationDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      cancellationReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
      },
    },
    {
      tableName: 'organization_subscriptions',
      indexes: [
        { fields: ['orgId'] },
        { fields: ['planId'] },
        { unique: true, fields: ['razorpaySubscriptionId'] },
        { fields: ['status'] },
        { fields: ['currentPeriodEnd'] },
      ],
    }
  );

  return OrganizationSubscription;
}

