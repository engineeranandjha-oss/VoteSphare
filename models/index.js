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
};
