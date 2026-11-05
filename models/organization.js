import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineOrganization(sequelize) {
  const Organization = sequelize.define(
    'Organization',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          is: /^[a-z0-9-]+$/i,
        },
      },
      type: {
        type: DataTypes.STRING(50),
        defaultValue: 'other',
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      logo: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
    },
    {
      tableName: 'organizations',
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['ownerId'] },
      ],
      hooks: {
        beforeValidate: (org) => {
          if (org.slug) {
            org.slug = org.slug.toLowerCase().trim();
          }
        },
      },
    }
  );

  return Organization;
}
