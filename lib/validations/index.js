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
// Helper for image URL or data URL (base64) validation
const imageSchema = z
  .string()
  .refine(
    (val) =>
      !val ||
      val.startsWith('http://') ||
      val.startsWith('https://') ||
      val.startsWith('data:image/') ||
      val.startsWith('/'),
    { message: 'Must be a valid image URL or uploaded image' }
  )
  .optional()
  .nullable()
  .or(z.literal(''));

// ==========================================
// User Schemas
// ==========================================
export const userUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  image: imageSchema,
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
    .enum([
      'school',
      'university',
      'company',
      'society',
      'ngo',
      'family',
      'student_council',
      'club',
      'corporate',
      'nonprofit',
      'other',
    ])
    .default('other'),
  description: z.string().max(1000).optional().nullable(),
  logo: imageSchema,
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
    .default({
      allowCandidateWithdrawal: true,
      requireVoterVerification: true,
      showLiveTurnout: true,
    }),
});

export const electionUpdateSchema = electionCreateSchema.partial().extend({
  status: z.enum(['draft', 'scheduled', 'live', 'ended', 'published', 'archived']).optional(),
});

export const electionTransitionSchema = z.object({
  status: z.enum(['draft', 'scheduled', 'live', 'ended', 'published', 'archived']),
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
  photo: imageSchema,
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
// Eligibility Schemas
// ==========================================
export const eligibilityAssignSchema = z
  .object({
    memberIds: z.array(z.string().uuid()).optional(),
    assignAllActive: z.boolean().optional().default(false),
  })
  .refine((data) => data.assignAllActive || (data.memberIds && data.memberIds.length > 0), {
    message: 'Either memberIds array or assignAllActive=true must be provided',
  });

export const eligibilityUpdateSchema = z.object({
  status: z.enum(['eligible', 'voted', 'disqualified']),
});

// ==========================================
// Vote Schemas
// ==========================================
export const voteSelectionSchema = z.object({
  positionId: z.string().uuid({ message: 'Invalid position ID' }),
  candidateId: z.string().uuid({ message: 'Invalid candidate ID' }),
});

export const voteCastSchema = z
  .object({
    token: z.string().optional(),
    selections: z.array(voteSelectionSchema).optional(),
    votes: z.array(voteSelectionSchema).optional(),
    isAnonymous: z.boolean().default(true),
  })
  .refine(
    (data) =>
      (data.selections && data.selections.length > 0) ||
      (data.votes && data.votes.length > 0),
    {
      message: 'Ballot must contain at least one candidate selection',
    }
  );

// ==========================================
// Auth Schemas
// ==========================================
export const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const passwordResetConfirmSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

// ==========================================
// Contact Form Schema
// ==========================================
export const contactSubmissionSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim(),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email cannot exceed 254 characters')
    .trim()
    .toLowerCase(),
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(160, 'Subject cannot exceed 160 characters')
    .trim(),
  message: z
    .string()
    .min(20, 'Message must be at least 20 characters')
    .max(5000, 'Message cannot exceed 5,000 characters')
    .trim(),
  category: z
    .enum([
      'General inquiry',
      'Organization onboarding',
      'Election support',
      'Account or login support',
      'Privacy or security report',
    ])
    .default('General inquiry'),
  organization: z
    .string()
    .max(150, 'Organization name cannot exceed 150 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'You must consent to the processing of your contact details' }),
  }),
  honeypot: z.string().optional().or(z.literal('')),
});

// ==========================================
// Billing & Payment Schemas
// ==========================================

/**
 * Validates Indian 15-character GSTIN format
 * Format: 2 digits (state) + 10 alphanumeric (PAN) + 1 digit (entity) + 'Z' + 1 checksum
 */
export const gstinSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
    'Invalid Indian GSTIN format (e.g. 29AAAAA0000A1Z5)'
  )
  .optional()
  .nullable()
  .or(z.literal(''));

export const subscriptionCreateSchema = z.object({
  orgId: uuidSchema,
  planSlug: z.enum([
    'starter-monthly',
    'starter-annual',
    'pro-monthly',
    'pro-annual',
    'enterprise',
  ]),
  customerGstin: gstinSchema,
  billingName: z.string().min(2, 'Billing name must be at least 2 characters').max(150).trim().optional(),
  billingAddress: z.string().max(500, 'Billing address cannot exceed 500 characters').trim().optional().or(z.literal('')),
});

export const orderCreateSchema = z.object({
  orgId: uuidSchema,
  orderType: z.enum(['event_pass', 'voter_booster']),
  boosterSlug: z.enum(['booster-250', 'booster-500', 'booster-1500']).optional(),
  electionId: uuidSchema.optional(),
  customerGstin: gstinSchema,
  billingName: z.string().min(2).max(150).trim().optional(),
  billingAddress: z.string().max(500).trim().optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.orderType === 'voter_booster' && !data.boosterSlug) {
      return false;
    }
    return true;
  },
  {
    message: 'boosterSlug is required when orderType is voter_booster',
    path: ['boosterSlug'],
  }
);

export const subscriptionVerifySchema = z.object({
  orgId: uuidSchema.optional(),
  razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required').trim(),
  razorpay_subscription_id: z.string().min(1, 'razorpay_subscription_id is required').trim(),
  razorpay_signature: z.string().min(1, 'razorpay_signature is required').trim(),
});

export const orderVerifySchema = z.object({
  orgId: uuidSchema.optional(),
  electionId: uuidSchema.optional(),
  razorpay_order_id: z.string().min(1, 'razorpay_order_id is required').trim(),
  razorpay_payment_id: z.string().min(1, 'razorpay_payment_id is required').trim(),
  razorpay_signature: z.string().min(1, 'razorpay_signature is required').trim(),
});

export const subscriptionCancelSchema = z.object({
  orgId: uuidSchema,
  reason: z.string().max(255, 'Reason cannot exceed 255 characters').trim().optional(),
});



