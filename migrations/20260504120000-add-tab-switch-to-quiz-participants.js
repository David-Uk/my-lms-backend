'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('quiz_participants', 'tabSwitchCount', {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: 'Number of times the participant switched tabs during the quiz',
        });

        await queryInterface.addColumn(
            'quiz_participants',
            'terminatedByTabSwitch',
            {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
                comment:
                    'Whether the quiz was auto-terminated due to a tab switch violation',
            },
        );
    },

    down: async (queryInterface) => {
        await queryInterface.removeColumn('quiz_participants', 'tabSwitchCount');
        await queryInterface.removeColumn(
            'quiz_participants',
            'terminatedByTabSwitch',
        );
    },
};
