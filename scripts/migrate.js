/* eslint-disable no-console */
import db from '../models/index.js';

/**
 * Synchronizes Sequelize models with the database.
 * Run with: node scripts/migrate.js
 */
async function syncDatabase() {
  console.log('🔄 Connecting to MySQL and synchronizing models...');

  try {
    await db.sequelize.authenticate();
    console.log('✅ Connection to database established successfully.');

    // sync({ alter: true }) updates tables to match model definitions safely
    await db.sequelize.sync({ alter: true });
    console.log('✅ All models were synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to synchronize database:', error);
    process.exit(1);
  }
}

syncDatabase();
