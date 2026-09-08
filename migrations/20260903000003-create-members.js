/**
 * Migration: Create members table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('members', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      orgId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'organizations',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      role: {
        type: Sequelize.ENUM('owner', 'admin', 'voter'),
        defaultValue: 'voter',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('active', 'pending', 'suspended'),
        defaultValue: 'active',
        allowNull: false,
      },
      joinedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('members', ['orgId', 'userId'], {
      unique: true,
      name: 'members_org_user_unique',
    });

    await queryInterface.addIndex('members', ['orgId'], {
      name: 'members_org_id_index',
    });

    await queryInterface.addIndex('members', ['userId'], {
      name: 'members_user_id_index',
    });

    await queryInterface.addIndex('members', ['role'], {
      name: 'members_role_index',
    });

    await queryInterface.addIndex('members', ['status'], {
      name: 'members_status_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('members');
  },
};
