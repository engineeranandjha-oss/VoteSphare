import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default function defineCertificate(sequelize) {
  const Certificate = sequelize.define(
    'Certificate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => crypto.randomUUID(),
        primaryKey: true,
      },
      certificateId: {
        type: DataTypes.STRING(60),
        allowNull: false,
        unique: true,
      },
      orgId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
      },
      electionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'elections',
          key: 'id',
        },
      },
      candidateId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'candidates',
          key: 'id',
        },
      },
      positionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'positions',
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
      certificateType: {
        type: DataTypes.ENUM('victory', 'participation'),
        allowNull: false,
      },
      recipientNameSnapshot: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      electionTitleSnapshot: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      positionTitleSnapshot: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      orgNameSnapshot: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      votesReceived: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      totalVotes: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      votePercentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
      },
      resultVersion: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      verificationToken: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      issuedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
      revokedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      revocationReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      revokedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      metadata: {
        type: DataTypes.JSON,
        defaultValue: {},
        allowNull: true,
      },
      pdfStorageReference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'certificates',
      indexes: [
        { unique: true, fields: ['certificateId'] },
        { unique: true, fields: ['verificationToken'] },
        {
          unique: true,
          name: 'uniq_cert_issuance',
          fields: ['electionId', 'positionId', 'candidateId', 'certificateType', 'resultVersion'],
        },
        { fields: ['orgId'] },
        { fields: ['electionId'] },
        { fields: ['userId'] },
        { fields: ['certificateType'] },
        { fields: ['issuedAt'] },
      ],
    }
  );

  return Certificate;
}

