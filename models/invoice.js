import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineInvoice(sequelize) {
  const Invoice = sequelize.define(
    'Invoice',
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
      paymentId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'payments',
          key: 'id',
        },
      },
      invoiceNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      subtotal: {
        type: DataTypes.INTEGER, // in paise
        allowNull: false,
      },
      taxAmount: {
        type: DataTypes.INTEGER, // in paise (e.g. 18% GST)
        defaultValue: 0,
        allowNull: false,
      },
      total: {
        type: DataTypes.INTEGER, // in paise
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      customerGstin: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      billingName: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      billingAddress: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pdfUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('issued', 'paid', 'void', 'refunded'),
        defaultValue: 'paid',
        allowNull: false,
      },
      issuedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'invoices',
      indexes: [
        { unique: true, fields: ['invoiceNumber'] },
        { unique: true, fields: ['paymentId'] },
        { fields: ['orgId'] },
        { fields: ['issuedAt'] },
      ],
    }
  );

  return Invoice;
}

