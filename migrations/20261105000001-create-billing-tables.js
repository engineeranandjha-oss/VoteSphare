/**
 * Migration: Create Billing, Subscription, Payment, Invoice, Usage, and Webhook Tables
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. subscription_plans
    await queryInterface.createTable('subscription_plans', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      planType: {
        type: Sequelize.ENUM('free', 'recurring', 'one_time'),
        defaultValue: 'recurring',
        allowNull: false,
      },
      billingInterval: {
        type: Sequelize.ENUM('monthly', 'yearly', 'once'),
        defaultValue: 'monthly',
        allowNull: false,
      },
      price: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      voterLimitPerElection: {
        type: Sequelize.INTEGER,
        defaultValue: 50,
        allowNull: false,
      },
      monthlyElectionAllowance: {
        type: Sequelize.INTEGER,
        defaultValue: 2,
        allowNull: false,
      },
      simultaneousLiveElections: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      features: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      razorpayPlanId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
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

    await queryInterface.addIndex('subscription_plans', ['slug'], {
      unique: true,
      name: 'subscription_plans_slug_unique',
    });
    await queryInterface.addIndex('subscription_plans', ['isActive'], {
      name: 'subscription_plans_is_active_idx',
    });
    await queryInterface.addIndex('subscription_plans', ['razorpayPlanId'], {
      name: 'subscription_plans_razorpay_plan_id_idx',
    });

    // 2. organization_subscriptions
    await queryInterface.createTable('organization_subscriptions', {
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
      planId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'subscription_plans',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      razorpaySubscriptionId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true,
      },
      status: {
        type: Sequelize.ENUM('trialing', 'active', 'pending', 'halted', 'cancelled', 'completed', 'expired'),
        defaultValue: 'active',
        allowNull: false,
      },
      billingInterval: {
        type: Sequelize.ENUM('monthly', 'yearly', 'once'),
        defaultValue: 'monthly',
        allowNull: false,
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      currentPeriodStart: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      currentPeriodEnd: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      nextBillingDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      gracePeriodEnd: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancellationDate: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      cancellationReason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSON,
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

    await queryInterface.addIndex('organization_subscriptions', ['orgId'], {
      name: 'org_subscriptions_org_id_idx',
    });
    await queryInterface.addIndex('organization_subscriptions', ['planId'], {
      name: 'org_subscriptions_plan_id_idx',
    });
    await queryInterface.addIndex('organization_subscriptions', ['razorpaySubscriptionId'], {
      unique: true,
      name: 'org_subscriptions_razorpay_sub_id_unique',
    });
    await queryInterface.addIndex('organization_subscriptions', ['status'], {
      name: 'org_subscriptions_status_idx',
    });
    await queryInterface.addIndex('organization_subscriptions', ['currentPeriodEnd'], {
      name: 'org_subscriptions_period_end_idx',
    });

    // 3. payments
    await queryInterface.createTable('payments', {
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
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organization_subscriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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
      razorpayOrderId: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      razorpayPaymentId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      razorpaySignature: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('created', 'authorized', 'captured', 'refunded', 'failed'),
        defaultValue: 'captured',
        allowNull: false,
      },
      paymentType: {
        type: Sequelize.ENUM('subscription_charge', 'event_pass', 'voter_booster'),
        allowNull: false,
      },
      paymentMethod: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      cardLast4: {
        type: Sequelize.STRING(4),
        allowNull: true,
      },
      cardNetwork: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      errorCode: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      errorDescription: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      paidAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('payments', ['razorpayPaymentId'], {
      unique: true,
      name: 'payments_razorpay_payment_id_unique',
    });
    await queryInterface.addIndex('payments', ['razorpayOrderId'], {
      name: 'payments_razorpay_order_id_idx',
    });
    await queryInterface.addIndex('payments', ['orgId'], {
      name: 'payments_org_id_idx',
    });
    await queryInterface.addIndex('payments', ['status'], {
      name: 'payments_status_idx',
    });

    // 4. invoices
    await queryInterface.createTable('invoices', {
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
      paymentId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'payments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      invoiceNumber: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      subtotal: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      taxAmount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      total: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR',
        allowNull: false,
      },
      customerGstin: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      billingName: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      billingAddress: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      pdfUrl: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('issued', 'paid', 'void', 'refunded'),
        defaultValue: 'paid',
        allowNull: false,
      },
      issuedAt: {
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

    await queryInterface.addIndex('invoices', ['invoiceNumber'], {
      unique: true,
      name: 'invoices_invoice_number_unique',
    });
    await queryInterface.addIndex('invoices', ['paymentId'], {
      unique: true,
      name: 'invoices_payment_id_unique',
    });
    await queryInterface.addIndex('invoices', ['orgId'], {
      name: 'invoices_org_id_idx',
    });

    // 5. usage_records
    await queryInterface.createTable('usage_records', {
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
      subscriptionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'organization_subscriptions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      electionId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'elections',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      usageType: {
        type: Sequelize.ENUM('election_created', 'voter_enrolled', 'email_dispatched'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
      },
      billingPeriodMonth: {
        type: Sequelize.STRING(7),
        allowNull: false,
      },
      recordedAt: {
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

    await queryInterface.addIndex('usage_records', ['orgId', 'usageType', 'billingPeriodMonth'], {
      name: 'usage_records_org_type_period_idx',
    });
    await queryInterface.addIndex('usage_records', ['electionId'], {
      name: 'usage_records_election_id_idx',
    });

    // 6. webhook_events
    await queryInterface.createTable('webhook_events', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      provider: {
        type: Sequelize.STRING(50),
        defaultValue: 'razorpay',
        allowNull: false,
      },
      eventId: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      eventType: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      processingStatus: {
        type: Sequelize.ENUM('pending', 'processing', 'processed', 'failed', 'ignored'),
        defaultValue: 'pending',
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      processedAt: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex('webhook_events', ['provider', 'eventId'], {
      unique: true,
      name: 'webhook_events_provider_event_id_unique',
    });
    await queryInterface.addIndex('webhook_events', ['eventType'], {
      name: 'webhook_events_event_type_idx',
    });
    await queryInterface.addIndex('webhook_events', ['processingStatus'], {
      name: 'webhook_events_status_idx',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('webhook_events');
    await queryInterface.dropTable('usage_records');
    await queryInterface.dropTable('invoices');
    await queryInterface.dropTable('payments');
    await queryInterface.dropTable('organization_subscriptions');
    await queryInterface.dropTable('subscription_plans');
  },
};

