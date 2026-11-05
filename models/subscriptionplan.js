import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineSubscriptionPlan(sequelize) {
  const SubscriptionPlan = sequelize.define(
    'SubscriptionPlan',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9-]+$/i,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      planType: {
        type: DataTypes.ENUM('free', 'recurring', 'one_time'),
        defaultValue: 'recurring',
        allowNull: false,
      },
      billingInterval: {
        type: DataTypes.ENUM('monthly', 'yearly', 'once'),
        defaultValue: 'monthly',
        allowNull: false,
      },
      price: {
        type: DataTypes.INTEGER, // In paise (e.g. 149900 = ₹1,499)
        defaultValue: 0,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      voterLimitPerElection: {
        type: DataTypes.INTEGER,
        defaultValue: 50,
        allowNull: false,
      },
      monthlyElectionAllowance: {
        type: DataTypes.INTEGER,
        defaultValue: 2,
        allowNull: false,
      },
      simultaneousLiveElections: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      features: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: false,
      },
      razorpayPlanId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
    },
    {
      tableName: 'subscription_plans',
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['isActive'] },
        { fields: ['razorpayPlanId'] },
      ],
      hooks: {
        beforeValidate: (plan) => {
          if (plan.slug) {
            plan.slug = plan.slug.toLowerCase().trim();
          }
        },
      },
    }
  );

  return SubscriptionPlan;
}

