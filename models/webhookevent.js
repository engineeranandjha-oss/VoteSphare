import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineWebhookEvent(sequelize) {
  const WebhookEvent = sequelize.define(
    'WebhookEvent',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      provider: {
        type: DataTypes.STRING(50),
        defaultValue: 'razorpay',
        allowNull: false,
      },
      eventId: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      eventType: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      processingStatus: {
        type: DataTypes.ENUM('pending', 'processing', 'processed', 'failed', 'ignored'),
        defaultValue: 'pending',
        allowNull: false,
      },
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'webhook_events',
      indexes: [
        { unique: true, fields: ['provider', 'eventId'] },
        { fields: ['eventType'] },
        { fields: ['processingStatus'] },
        { fields: ['createdAt'] },
      ],
    }
  );

  return WebhookEvent;
}

