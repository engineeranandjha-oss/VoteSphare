import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function definePayment(sequelize) {
  const Payment = sequelize.define(
    'Payment',
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
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      razorpayOrderId: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      razorpayPaymentId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      razorpaySignature: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      amount: {
        type: DataTypes.INTEGER, // in paise
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'),
        defaultValue: 'captured',
        allowNull: false,
      },
      paymentType: {
        type: DataTypes.ENUM('subscription_charge', 'event_pass', 'voter_booster'),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      cardLast4: {
        type: DataTypes.STRING(4),
        allowNull: true,
      },
      cardNetwork: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      errorCode: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      errorDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'payments',
      indexes: [
        { unique: true, fields: ['razorpayPaymentId'] },
        { fields: ['razorpayOrderId'] },
        { fields: ['orgId'] },
        { fields: ['subscriptionId'] },
        { fields: ['status'] },
        { fields: ['paidAt'] },
      ],
    }
  );

  return Payment;
}

