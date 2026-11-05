/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';

function loadEnvFile(filePath) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^["']|["']$/g, '');
        const cleanKey = key.trim();
        if (cleanKey && !process.env[cleanKey]) {
          process.env[cleanKey] = val;
        }
      }
    });
  }
}

// Load .env.local first, then .env
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const { default: db } = await import('../models/index.js');

/**
 * Synchronizes Sequelize models with the database.
 * Run with: npm run db:migrate
 */
async function syncDatabase() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const database = process.env.MYSQL_DATABASE || 'votesphere';
  console.log(`🔄 Connecting to MySQL (${host}/${database}) and synchronizing tables...`);

  try {
    await db.sequelize.authenticate();
    console.log('✅ Connection to database established successfully.');

    // sync({ alter: true }) updates tables to match model definitions safely
    await db.sequelize.sync({ alter: true });

    // Explicitly modify organizations.type to VARCHAR(50) if it was previously an ENUM
    try {
      await db.sequelize.query('ALTER TABLE `organizations` MODIFY COLUMN `type` VARCHAR(50) NOT NULL DEFAULT "other";');
      console.log('✅ Column organizations.type altered to VARCHAR(50).');
    } catch (colErr) {
      console.warn('⚠️ organizations.type alter note:', colErr.message);
    }

    console.log('✅ All models (users, organizations, members, elections, candidates, positions, eligibilities, votes, subscription_plans, organization_subscriptions, payments, invoices, usage_records, webhook_events) were synchronized successfully.');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to synchronize database:', error);
    process.exit(1);
  }
}

syncDatabase();

