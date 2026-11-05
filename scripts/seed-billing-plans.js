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

// Load environment
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const { default: db } = await import('../models/index.js');
const { PLANS_CONFIG } = await import('../lib/billing/plans-config.js');

/**
 * Seeds canonical subscription plans and backfills existing organizations to Free plan.
 * Run with: npm run db:seed:plans
 */
export async function seedBillingPlans() {
  console.log('🌱 Starting Subscription Plans Seeding & Org Backfill...');

  try {
    await db.sequelize.authenticate();
    console.log('✅ Connected to database.');

    // 1. Seed or update canonical plans from PLANS_CONFIG
    let createdCount = 0;
    let updatedCount = 0;

    for (const planDef of Object.values(PLANS_CONFIG)) {
      const [plan, created] = await db.SubscriptionPlan.findOrCreate({
        where: { slug: planDef.slug },
        defaults: {
          name: planDef.name,
          slug: planDef.slug,
          description: planDef.description,
          planType: planDef.planType,
          billingInterval: planDef.billingInterval,
          price: planDef.price,
          currency: planDef.currency,
          voterLimitPerElection: planDef.voterLimitPerElection,
          monthlyElectionAllowance: planDef.monthlyElectionAllowance,
          simultaneousLiveElections: planDef.simultaneousLiveElections,
          features: planDef.features,
          isActive: planDef.isActive,
          sortOrder: planDef.sortOrder,
        },
      });

      if (created) {
        createdCount++;
        console.log(`  + Created plan: ${plan.name} (${plan.slug})`);
      } else {
        // Update plan fields if existing
        plan.name = planDef.name;
        plan.description = planDef.description;
        plan.planType = planDef.planType;
        plan.billingInterval = planDef.billingInterval;
        plan.price = planDef.price;
        plan.currency = planDef.currency;
        plan.voterLimitPerElection = planDef.voterLimitPerElection;
        plan.monthlyElectionAllowance = planDef.monthlyElectionAllowance;
        plan.simultaneousLiveElections = planDef.simultaneousLiveElections;
        plan.features = planDef.features;
        plan.isActive = planDef.isActive;
        plan.sortOrder = planDef.sortOrder;
        await plan.save();
        updatedCount++;
      }
    }

    console.log(`✅ Plans synchronized: ${createdCount} created, ${updatedCount} verified/updated.`);

    // 2. Fetch the Free plan
    const freePlan = await db.SubscriptionPlan.findOne({ where: { slug: 'free' } });
    if (!freePlan) {
      throw new Error('Free plan could not be found after seeding');
    }

    // 3. Find all organizations lacking an active subscription
    const allOrgs = await db.Organization.findAll({
      attributes: ['id', 'name'],
      include: [
        {
          model: db.OrganizationSubscription,
          as: 'subscriptions',
          where: { status: 'active' },
          required: false,
        },
      ],
    });

    let backfilledCount = 0;
    const now = new Date();
    // Far-future expiration for permanent Free tier
    const perpetualEnd = new Date('2099-12-31T23:59:59.000Z');

    for (const org of allOrgs) {
      if (!org.subscriptions || org.subscriptions.length === 0) {
        await db.OrganizationSubscription.create({
          orgId: org.id,
          planId: freePlan.id,
          status: 'active',
          billingInterval: 'monthly',
          startDate: now,
          currentPeriodStart: now,
          currentPeriodEnd: perpetualEnd,
          metadata: { backfilled: true, assignedAt: now.toISOString() },
        });
        backfilledCount++;
      }
    }

    console.log(`✅ Backfilled ${backfilledCount} organization(s) with perpetual Free plan subscription.`);
    console.log('🎉 Subscription seeding & backfill completed successfully.');
    return { createdCount, updatedCount, backfilledCount };
  } catch (error) {
    console.error('❌ Failed to seed billing plans:', error);
    throw error;
  }
}

// Execute directly if run as a script
if (process.argv[1] && process.argv[1].endsWith('seed-billing-plans.js')) {
  seedBillingPlans()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

