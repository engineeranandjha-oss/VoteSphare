import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  paginationSchema,
  uuidSchema,
  userUpdateSchema,
  organizationCreateSchema,
  organizationUpdateSchema,
  memberInviteSchema,
  memberUpdateRoleSchema,
  electionCreateSchema,
  electionUpdateSchema,
  electionTransitionSchema,
  positionCreateSchema,
  positionUpdateSchema,
  candidateCreateSchema,
  candidateUpdateSchema,
  eligibilityAssignSchema,
  eligibilityUpdateSchema,
  voteCastSchema,
  signupSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  contactSubmissionSchema,
} from '../lib/validations/index.js';

describe('VoteSphere Schema & Data Validation Unit Tests', () => {
  describe('1. Pagination & UUID Primitives', () => {
    test('pagination defaults page=1 and limit=10', () => {
      const parsed = paginationSchema.parse({});
      assert.equal(parsed.page, 1);
      assert.equal(parsed.limit, 10);
    });

    test('pagination coerces string inputs and enforces limits', () => {
      const parsed = paginationSchema.parse({ page: '2', limit: '25' });
      assert.equal(parsed.page, 2);
      assert.equal(parsed.limit, 25);
    });

    test('pagination rejects negative or zero numbers and limit > 100', () => {
      assert.throws(() => paginationSchema.parse({ page: 0 }));
      assert.throws(() => paginationSchema.parse({ limit: 101 }));
    });

    test('uuidSchema accepts valid UUIDv4 and rejects invalid string', () => {
      const valid = '123e4567-e89b-12d3-a456-426614174000';
      assert.equal(uuidSchema.parse(valid), valid);
      assert.throws(() => uuidSchema.parse('invalid-uuid-12345'));
    });
  });

  describe('2. User & Profile Schemas', () => {
    test('validates user update with name and valid image URL or base64', () => {
      const validPayload = {
        name: 'Jane Doe',
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      };
      const parsed = userUpdateSchema.parse(validPayload);
      assert.equal(parsed.name, 'Jane Doe');
    });

    test('accepts data URI for avatar images', () => {
      const parsed = userUpdateSchema.parse({
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      });
      assert.ok(parsed.image.startsWith('data:image/'));
    });

    test('rejects names shorter than 2 characters', () => {
      assert.throws(() => userUpdateSchema.parse({ name: 'A' }));
    });
  });

  describe('3. Organization Schemas', () => {
    test('validates organization creation with required name and valid slug', () => {
      const org = organizationCreateSchema.parse({
        name: 'Stanford Alumni Association',
        slug: 'stanford-alumni-2026',
        type: 'university',
      });
      assert.equal(org.name, 'Stanford Alumni Association');
      assert.equal(org.slug, 'stanford-alumni-2026');
      assert.equal(org.type, 'university');
    });

    test('rejects uppercase letters or special characters in slug', () => {
      assert.throws(() =>
        organizationCreateSchema.parse({
          name: 'Tech Corp',
          slug: 'Tech_Corp_2026!',
        })
      );
    });

    test('organizationUpdateSchema allows partial updates', () => {
      const updated = organizationUpdateSchema.parse({
        description: 'New updated description',
      });
      assert.equal(updated.description, 'New updated description');
    });
  });

  describe('4. Member & Role Schemas', () => {
    test('validates member invitation with default role "voter"', () => {
      const invite = memberInviteSchema.parse({ email: 'voter@university.edu' });
      assert.equal(invite.email, 'voter@university.edu');
      assert.equal(invite.role, 'voter');
    });

    test('accepts explicit role assignment in invitation', () => {
      const invite = memberInviteSchema.parse({ email: 'admin@university.edu', role: 'admin' });
      assert.equal(invite.role, 'admin');
    });

    test('validates role modification with status updates', () => {
      const roleUpdate = memberUpdateRoleSchema.parse({
        role: 'admin',
        status: 'active',
      });
      assert.equal(roleUpdate.role, 'admin');
      assert.equal(roleUpdate.status, 'active');
    });
  });

  describe('5. Election & Lifecycle Schemas', () => {
    test('validates election creation with default configuration options', () => {
      const election = electionCreateSchema.parse({
        title: 'Executive Council General Election 2026',
        description: 'Annual election for student leadership',
      });
      assert.equal(election.title, 'Executive Council General Election 2026');
      assert.equal(election.config.showLiveTurnout, true);
      assert.equal(election.config.requireVoterVerification, true);
    });

    test('rejects election title shorter than 3 characters', () => {
      assert.throws(() => electionCreateSchema.parse({ title: 'EC' }));
    });

    test('validates state transition targets', () => {
      const validStatuses = ['draft', 'scheduled', 'live', 'ended', 'published', 'archived'];
      for (const status of validStatuses) {
        assert.equal(electionTransitionSchema.parse({ status }).status, status);
      }
      assert.throws(() => electionTransitionSchema.parse({ status: 'invalid_status' }));
    });
  });

  describe('6. Position & Candidate Schemas', () => {
    test('validates position creation with display order', () => {
      const pos = positionCreateSchema.parse({
        name: 'President & Chief Representative',
        order: 1,
      });
      assert.equal(pos.name, 'President & Chief Representative');
      assert.equal(pos.order, 1);
    });

    test('validates candidate creation with manifesto and social links', () => {
      const candidate = candidateCreateSchema.parse({
        name: 'Alexander Hamilton',
        bio: 'Economics and governance specialist',
        manifesto: 'Promoting transparent fiscal management and democratic engagement.',
        socialLinks: {
          twitter: 'https://twitter.com/ahamilton',
          linkedin: 'https://linkedin.com/in/ahamilton',
        },
      });
      assert.equal(candidate.name, 'Alexander Hamilton');
      assert.equal(candidate.socialLinks.twitter, 'https://twitter.com/ahamilton');
    });

    test('allows candidate withdrawal status update', () => {
      const updated = candidateUpdateSchema.parse({ status: 'withdrawn' });
      assert.equal(updated.status, 'withdrawn');
    });
  });

  describe('7. Eligibility & Vote Casting Schemas', () => {
    test('validates eligibility bulk assignment with memberIds array', () => {
      const validUuid = '123e4567-e89b-12d3-a456-426614174000';
      const assign = eligibilityAssignSchema.parse({ memberIds: [validUuid] });
      assert.equal(assign.memberIds.length, 1);
    });

    test('validates eligibility assignment with assignAllActive=true', () => {
      const assign = eligibilityAssignSchema.parse({ assignAllActive: true });
      assert.equal(assign.assignAllActive, true);
    });

    test('rejects eligibility assignment when neither memberIds nor assignAllActive is given', () => {
      assert.throws(() => eligibilityAssignSchema.parse({}));
    });

    test('validates vote cast payload with selections and anonymous flag', () => {
      const posId = '123e4567-e89b-12d3-a456-426614174000';
      const candId = '223e4567-e89b-12d3-a456-426614174001';
      const ballot = voteCastSchema.parse({
        selections: [{ positionId: posId, candidateId: candId }],
        isAnonymous: true,
      });
      assert.equal(ballot.selections.length, 1);
      assert.equal(ballot.isAnonymous, true);
    });
  });
});
