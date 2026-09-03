import { DataTypes } from 'sequelize';

export default function defineOrganization(sequelize) {
  const Organization = sequelize.define(
    'Organization',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
        type: DataTypes.ENUM('school', 'university', 'company', 'society', 'ngo', 'family', 'other'),
        defaultValue: 'other',
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
    },
    {
      tableName: 'organizations',
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['ownerId'] },
      ],
    }
  );

  return Organization;
}
