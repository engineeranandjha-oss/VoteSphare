/**
 * Migration: Create elections table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('elections', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'scheduled', 'live', 'ended', 'published', 'archived'),
        defaultValue: 'draft',
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      config: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
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

    await queryInterface.addIndex('elections', ['orgId'], {
      name: 'elections_org_id_index',
    });

    await queryInterface.addIndex('elections', ['status'], {
      name: 'elections_status_index',
    });

    await queryInterface.addIndex('elections', ['createdBy'], {
      name: 'elections_created_by_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('elections');
  },
};
