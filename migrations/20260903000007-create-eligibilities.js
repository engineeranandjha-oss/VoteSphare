/**
 * Migration: Create eligibility table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('eligibility', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      electionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'elections',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      memberId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'members',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM('eligible', 'voted', 'disqualified'),
        defaultValue: 'eligible',
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

    await queryInterface.addIndex('eligibility', ['electionId', 'memberId'], {
      unique: true,
      name: 'eligibility_election_member_unique',
    });

    await queryInterface.addIndex('eligibility', ['electionId'], {
      name: 'eligibility_election_id_index',
    });

    await queryInterface.addIndex('eligibility', ['memberId'], {
      name: 'eligibility_member_id_index',
    });

    await queryInterface.addIndex('eligibility', ['status'], {
      name: 'eligibility_status_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('eligibility');
  },
};
