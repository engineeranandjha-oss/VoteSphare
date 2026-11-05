/**
 * Migration: Add Transparency & Member Directory fields to Organizations & Users,
 * and create the Certificates table for Winner & Participation Recognition.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Add columns to organizations
    const orgTable = await queryInterface.describeTable('organizations');

    if (!orgTable.coverImage) {
      await queryInterface.addColumn('organizations', 'coverImage', {
        type: Sequelize.TEXT('long'),
        allowNull: true,
      });
    }
    if (!orgTable.website) {
      await queryInterface.addColumn('organizations', 'website', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!orgTable.publicEmail) {
      await queryInterface.addColumn('organizations', 'publicEmail', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!orgTable.publicPhone) {
      await queryInterface.addColumn('organizations', 'publicPhone', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
    if (!orgTable.showPublicPhone) {
      await queryInterface.addColumn('organizations', 'showPublicPhone', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
    if (!orgTable.location) {
      await queryInterface.addColumn('organizations', 'location', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }
    if (!orgTable.establishedDate) {
      await queryInterface.addColumn('organizations', 'establishedDate', {
        type: Sequelize.DATEONLY,
        allowNull: true,
      });
    }
    if (!orgTable.isVerified) {
      await queryInterface.addColumn('organizations', 'isVerified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
    if (!orgTable.memberDirectoryVisibility) {
      await queryInterface.addColumn('organizations', 'memberDirectoryVisibility', {
        type: Sequelize.ENUM('private', 'members_only', 'public'),
        defaultValue: 'members_only',
        allowNull: false,
      });
    }
    if (!orgTable.signatoryName) {
      await queryInterface.addColumn('organizations', 'signatoryName', {
        type: Sequelize.STRING(150),
        allowNull: true,
      });
    }
    if (!orgTable.signatoryTitle) {
      await queryInterface.addColumn('organizations', 'signatoryTitle', {
        type: Sequelize.STRING(150),
        allowNull: true,
      });
    }

    // 2. Add columns to users
    const userTable = await queryInterface.describeTable('users');

    if (!userTable.displayName) {
      await queryInterface.addColumn('users', 'displayName', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }
    if (!userTable.designation) {
      await queryInterface.addColumn('users', 'designation', {
        type: Sequelize.STRING(150),
        allowNull: true,
      });
    }
    if (!userTable.bio) {
      await queryInterface.addColumn('users', 'bio', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
    if (!userTable.phone) {
      await queryInterface.addColumn('users', 'phone', {
        type: Sequelize.STRING(50),
        allowNull: true,
      });
    }
    if (!userTable.showEmailPublicly) {
      await queryInterface.addColumn('users', 'showEmailPublicly', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
    if (!userTable.showPhonePublicly) {
      await queryInterface.addColumn('users', 'showPhonePublicly', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      });
    }
    if (!userTable.isProfilePublic) {
      await queryInterface.addColumn('users', 'isProfilePublic', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      });
    }
    if (!userTable.avatarVisible) {
      await queryInterface.addColumn('users', 'avatarVisible', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      });
    }
    if (!userTable.notificationPreferences) {
      await queryInterface.addColumn('users', 'notificationPreferences', {
        type: Sequelize.JSON,
        defaultValue: {
          emailInvites: true,
          turnoutUpdates: false,
          resultsPublished: true,
          billingUpdates: true,
        },
        allowNull: false,
      });
    }

    // 3. Create certificates table
    const tableExists = await queryInterface.tableExists('certificates');
    if (!tableExists) {
      await queryInterface.createTable('certificates', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        certificateId: {
          type: Sequelize.STRING(60),
          allowNull: false,
          unique: true,
        },
        orgId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'organizations',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        electionId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'elections',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        candidateId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'candidates',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        positionId: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'positions',
            key: 'id',
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        userId: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        certificateType: {
          type: Sequelize.ENUM('victory', 'participation'),
          allowNull: false,
        },
        recipientNameSnapshot: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        electionTitleSnapshot: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        positionTitleSnapshot: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        orgNameSnapshot: {
          type: Sequelize.STRING(255),
          allowNull: false,
        },
        votesReceived: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        totalVotes: {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        votePercentage: {
          type: Sequelize.DECIMAL(5, 2),
          allowNull: true,
        },
        resultVersion: {
          type: Sequelize.INTEGER,
          defaultValue: 1,
          allowNull: false,
        },
        verificationToken: {
          type: Sequelize.STRING(100),
          allowNull: false,
          unique: true,
        },
        issuedAt: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
        revokedAt: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        revocationReason: {
          type: Sequelize.TEXT,
          allowNull: true,
        },
        revokedBy: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE',
        },
        metadata: {
          type: Sequelize.JSON,
          defaultValue: {},
          allowNull: true,
        },
        pdfStorageReference: {
          type: Sequelize.STRING(255),
          allowNull: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      });

      // Indexes
      await queryInterface.addIndex('certificates', ['certificateId'], { unique: true });
      await queryInterface.addIndex('certificates', ['verificationToken'], { unique: true });
      await queryInterface.addIndex(
        'certificates',
        ['electionId', 'positionId', 'candidateId', 'certificateType', 'resultVersion'],
        { unique: true, name: 'uniq_cert_issuance' }
      );
      await queryInterface.addIndex('certificates', ['orgId']);
      await queryInterface.addIndex('certificates', ['electionId']);
      await queryInterface.addIndex('certificates', ['userId']);
      await queryInterface.addIndex('certificates', ['certificateType']);
      await queryInterface.addIndex('certificates', ['issuedAt']);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('certificates');
  },
};

