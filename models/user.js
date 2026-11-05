import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineUser(sequelize) {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      supabaseUserId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      image: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
      },
      displayName: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      designation: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      showEmailPublicly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      showPhonePublicly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isProfilePublic: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      avatarVisible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      notificationPreferences: {
        type: DataTypes.JSON,
        defaultValue: {
          emailInvites: true,
          turnoutUpdates: false,
          resultsPublished: true,
          billingUpdates: true,
        },
        allowNull: false,
      },
    },
    {
      tableName: 'users',
      indexes: [
        { unique: true, fields: ['supabaseUserId'] },
        { unique: true, fields: ['email'] },
      ],
    }
  );

  return User;
}
