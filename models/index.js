import sequelize from '../lib/sequelize.js';
import defineUser from './user.js';
import defineOrganization from './organization.js';
import defineMember from './member.js';
import defineElection from './election.js';
import definePosition from './position.js';
import defineCandidate from './candidate.js';
import defineEligibility from './eligibility.js';
import defineVote from './vote.js';
import defineAuditLog from './auditlog.js';
import defineSubscriptionPlan from './subscriptionplan.js';
import defineOrganizationSubscription from './organizationsubscription.js';
import definePayment from './payment.js';
import defineInvoice from './invoice.js';
import defineUsageRecord from './usagerecord.js';
import defineWebhookEvent from './webhookevent.js';
import defineCertificate from './certificate.js';

// Initialize Models
const User = defineUser(sequelize);
const Organization = defineOrganization(sequelize);
const Member = defineMember(sequelize);
const Election = defineElection(sequelize);
const Position = definePosition(sequelize);
const Candidate = defineCandidate(sequelize);
const Eligibility = defineEligibility(sequelize);
const Vote = defineVote(sequelize);
const AuditLog = defineAuditLog(sequelize);
const SubscriptionPlan = defineSubscriptionPlan(sequelize);
const OrganizationSubscription = defineOrganizationSubscription(sequelize);
const Payment = definePayment(sequelize);
const Invoice = defineInvoice(sequelize);
const UsageRecord = defineUsageRecord(sequelize);
const WebhookEvent = defineWebhookEvent(sequelize);
const Certificate = defineCertificate(sequelize);

// User <-> Organization (Owner)
User.hasMany(Organization, { foreignKey: 'ownerId', as: 'ownedOrganizations' });
Organization.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User <-> Member <-> Organization
User.hasMany(Member, { foreignKey: 'userId', as: 'memberships' });
Member.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Organization.hasMany(Member, { foreignKey: 'orgId', as: 'members', onDelete: 'CASCADE' });
Member.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

// Organization <-> Election
Organization.hasMany(Election, { foreignKey: 'orgId', as: 'elections', onDelete: 'CASCADE' });
Election.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

// User (Creator) <-> Election
User.hasMany(Election, { foreignKey: 'createdBy', as: 'createdElections' });
Election.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

// Election <-> Position
Election.hasMany(Position, { foreignKey: 'electionId', as: 'positions', onDelete: 'CASCADE' });
Position.belongsTo(Election, { foreignKey: 'electionId', as: 'election' });

// Position <-> Candidate
Position.hasMany(Candidate, { foreignKey: 'positionId', as: 'candidates', onDelete: 'CASCADE' });
Candidate.belongsTo(Position, { foreignKey: 'positionId', as: 'position' });

// User (Optional) <-> Candidate
User.hasMany(Candidate, { foreignKey: 'userId', as: 'candidacies' });
Candidate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Election <-> Eligibility <-> Member
Election.hasMany(Eligibility, { foreignKey: 'electionId', as: 'eligibilities', onDelete: 'CASCADE' });
Eligibility.belongsTo(Election, { foreignKey: 'electionId', as: 'election' });

Member.hasMany(Eligibility, { foreignKey: 'memberId', as: 'eligibilities', onDelete: 'CASCADE' });
Eligibility.belongsTo(Member, { foreignKey: 'memberId', as: 'member' });

// Vote Associations (Anonymous dissociated voting)
Election.hasMany(Vote, { foreignKey: 'electionId', as: 'votes' });
Vote.belongsTo(Election, { foreignKey: 'electionId', as: 'election' });

Position.hasMany(Vote, { foreignKey: 'positionId', as: 'votes' });
Vote.belongsTo(Position, { foreignKey: 'positionId', as: 'position' });

Candidate.hasMany(Vote, { foreignKey: 'candidateId', as: 'votes' });
Vote.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'candidate' });

Eligibility.hasMany(Vote, { foreignKey: 'eligibilityId', as: 'votes' });
Vote.belongsTo(Eligibility, { foreignKey: 'eligibilityId', as: 'eligibility' });

// Organization / User <-> AuditLog
Organization.hasMany(AuditLog, { foreignKey: 'orgId', as: 'auditLogs' });
AuditLog.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

User.hasMany(AuditLog, { foreignKey: 'userId', as: 'auditLogs' });
AuditLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ==========================================
// Billing & Subscription Associations
// ==========================================

// Organization <-> OrganizationSubscription
Organization.hasMany(OrganizationSubscription, { foreignKey: 'orgId', as: 'subscriptions', onDelete: 'CASCADE' });
OrganizationSubscription.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

// SubscriptionPlan <-> OrganizationSubscription
SubscriptionPlan.hasMany(OrganizationSubscription, { foreignKey: 'planId', as: 'subscriptions' });
OrganizationSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'plan' });

// Organization <-> Payment
Organization.hasMany(Payment, { foreignKey: 'orgId', as: 'payments' });
Payment.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

// OrganizationSubscription <-> Payment
OrganizationSubscription.hasMany(Payment, { foreignKey: 'subscriptionId', as: 'payments' });
Payment.belongsTo(OrganizationSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

// User <-> Payment
User.hasMany(Payment, { foreignKey: 'userId', as: 'payments' });
Payment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Payment <-> Invoice
Payment.hasOne(Invoice, { foreignKey: 'paymentId', as: 'invoice' });
Invoice.belongsTo(Payment, { foreignKey: 'paymentId', as: 'payment' });

// Organization <-> Invoice
Organization.hasMany(Invoice, { foreignKey: 'orgId', as: 'invoices' });
Invoice.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

// Organization & Subscription & Election <-> UsageRecord
Organization.hasMany(UsageRecord, { foreignKey: 'orgId', as: 'usageRecords', onDelete: 'CASCADE' });
UsageRecord.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

OrganizationSubscription.hasMany(UsageRecord, { foreignKey: 'subscriptionId', as: 'usageRecords' });
UsageRecord.belongsTo(OrganizationSubscription, { foreignKey: 'subscriptionId', as: 'subscription' });

Election.hasMany(UsageRecord, { foreignKey: 'electionId', as: 'usageRecords' });
UsageRecord.belongsTo(Election, { foreignKey: 'electionId', as: 'election' });

// ==========================================
// Certificate Associations (Constitutional Anonymity Preserved)
// ==========================================
Organization.hasMany(Certificate, { foreignKey: 'orgId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Organization, { foreignKey: 'orgId', as: 'organization' });

Election.hasMany(Certificate, { foreignKey: 'electionId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Election, { foreignKey: 'electionId', as: 'election' });

Position.hasMany(Certificate, { foreignKey: 'positionId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Position, { foreignKey: 'positionId', as: 'position' });

Candidate.hasMany(Certificate, { foreignKey: 'candidateId', as: 'certificates', onDelete: 'CASCADE' });
Certificate.belongsTo(Candidate, { foreignKey: 'candidateId', as: 'candidate' });

User.hasMany(Certificate, { foreignKey: 'userId', as: 'certificates' });
Certificate.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Certificate.belongsTo(User, { foreignKey: 'revokedBy', as: 'revoker' });

const db = {
  sequelize,
  User,
  Organization,
  Member,
  Election,
  Position,
  Candidate,
  Eligibility,
  Vote,
  AuditLog,
  SubscriptionPlan,
  OrganizationSubscription,
  Payment,
  Invoice,
  UsageRecord,
  WebhookEvent,
  Certificate,
};

export default db;
export {
  sequelize,
  User,
  Organization,
  Member,
  Election,
  Position,
  Candidate,
  Eligibility,
  Vote,
  AuditLog,
  SubscriptionPlan,
  OrganizationSubscription,
  Payment,
  Invoice,
  UsageRecord,
  WebhookEvent,
  Certificate,
};
