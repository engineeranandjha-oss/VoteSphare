/**
 * Migration: Create votes table
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('votes', {
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
      candidateId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'candidates',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      eligibilityId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'eligibility',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      isAnonymous: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('votes', ['eligibilityId', 'positionId'], {
      unique: true,
      name: 'votes_eligibility_position_unique',
    });

    await queryInterface.addIndex('votes', ['electionId'], {
      name: 'votes_election_id_index',
    });

    await queryInterface.addIndex('votes', ['positionId'], {
      name: 'votes_position_id_index',
    });

    await queryInterface.addIndex('votes', ['candidateId'], {
      name: 'votes_candidate_id_index',
    });

    await queryInterface.addIndex('votes', ['eligibilityId'], {
      name: 'votes_eligibility_id_index',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('votes');
  },
};
