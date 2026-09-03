import { z } from 'zod';

// ==========================================
// Common & Pagination Schemas
// ==========================================
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

// ==========================================
// User Schemas
// ==========================================
export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
});

// ==========================================
// Organization Schemas
// ==========================================
export const organizationCreateSchema = z.object({
  name: z.string().min(2, 'Organization name must be at least 2 characters').max(100),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens'),
  type: z
    .enum(['school', 'university', 'company', 'society', 'ngo', 'family', 'other'])
    .default('other'),
  description: z.string().max(1000).optional().nullable(),
});

export const organizationUpdateSchema = organizationCreateSchema.partial();

// ==========================================
// Member Schemas
// ==========================================
export const memberInviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'voter']).default('voter'),
});

export const memberUpdateRoleSchema = z.object({
  role: z.enum(['owner', 'admin', 'voter']),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
});

// ==========================================
// Election Schemas
// ==========================================
export const electionCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(2000).optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  endDate: z.coerce.date().optional().nullable(),
  config: z
    .object({
      allowCandidateWithdrawal: z.boolean().default(true),
      requireVoterVerification: z.boolean().default(true),
      showLiveTurnout: z.boolean().default(true),
    })
    .default({}),
});

export const electionUpdateSchema = electionCreateSchema.partial().extend({
  status: z.enum(['draft', 'scheduled', 'live', 'ended', 'published']).optional(),
});

// ==========================================
// Position Schemas
// ==========================================
export const positionCreateSchema = z.object({
  name: z.string().min(2, 'Position name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional().nullable(),
  order: z.number().int().min(0).default(0),
});

export const positionUpdateSchema = positionCreateSchema.partial();

// ==========================================
// Candidate Schemas
// ==========================================
export const candidateCreateSchema = z.object({
  userId: z.string().uuid().optional().nullable(),
  name: z.string().min(2, 'Candidate name must be at least 2 characters').max(100),
  photo: z.string().url('Invalid photo URL').optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  manifesto: z.string().max(5000).optional().nullable(),
  socialLinks: z
    .object({
      twitter: z.string().url().optional().or(z.literal('')),
      linkedin: z.string().url().optional().or(z.literal('')),
      website: z.string().url().optional().or(z.literal('')),
    })
    .default({}),
});

export const candidateUpdateSchema = candidateCreateSchema.partial().extend({
  status: z.enum(['active', 'withdrawn']).optional(),
});

// ==========================================
// Vote Schemas
// ==========================================
export const voteSelectionSchema = z.object({
  positionId: z.string().uuid(),
  candidateId: z.string().uuid(),
});

export const voteCastSchema = z.object({
  electionId: z.string().uuid(),
  token: z.string().min(1, 'Voting token required'),
  selections: z
    .array(voteSelectionSchema)
    .min(1, 'At least one vote selection must be provided'),
  isAnonymous: z.boolean().default(true),
});
