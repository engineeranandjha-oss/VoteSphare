/**
 * Migration: Create candidates table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('candidates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      positionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'positions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      photo: {
        type: Sequelize.STRING(1024),
        allowNull: true,
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      manifesto: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      socialLinks: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {},
      },
      status: {
        type: Sequelize.ENUM('active', 'withdrawn'),
        defaultValue: 'active',
        allowNull: false,
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

    await queryInterface.addIndex('candidates', ['positionId'], {
      name: 'candidates_position_id_index',
    });

    await queryInterface.addIndex('candidates', ['userId'], {
      name: 'candidates_user_id_index',
    });

    await queryInterface.addIndex('candidates', ['status'], {
      name: 'candidates_status_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('candidates');
  },
};
