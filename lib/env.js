import { z } from 'zod';

const envSchema = z
  .object({
    // Application
    NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

    // Supabase Public
    NEXT_PUBLIC_SUPABASE_URL: z
      .string()
      .url()
      .default('https://your-project.supabase.co'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('your-anon-key'),

    // Supabase Server-Only
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('your-service-role-key'),

    // Google OAuth Optional Server Reference
    GOOGLE_OAUTH_CLIENT_ID: z.string().optional().default(''),
    GOOGLE_OAUTH_CLIENT_SECRET: z.string().optional().default(''),
    GOOGLE_OAUTH_REDIRECT_URI: z.string().optional().default(''),

    // Resend Email
    RESEND_API_KEY: z.string().optional().default(''),
    RESEND_FROM_EMAIL: z.string().optional().default('VoteSphere <noreply@votesphere.org>'),
    RESEND_REPLY_TO_EMAIL: z.string().optional().default('support@votesphere.org'),
    CONTACT_RECIPIENT_EMAIL: z.string().email().optional().or(z.literal('')).default('support@votesphere.org'),
    EMAIL_DELIVERY_ENABLED: z.enum(['true', 'false']).default('false'),

    // Development Auth
    ENABLE_DEV_LOGIN: z.enum(['true', 'false']).default('false'),

    // Razorpay Payment Gateway (Indian INR Subscriptions & Orders)
    RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_KEY_SECRET: z.string().optional().default(''),
    RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),
    NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional().default(''),
    RAZORPAY_MOCK: z.enum(['true', 'false']).optional().default('false'),

    // MySQL Database
    MYSQL_HOST: z.string().default('localhost'),
    MYSQL_PORT: z.coerce.number().default(3306),
    MYSQL_USER: z.string().default('root'),
    MYSQL_PASSWORD: z.string().default(''),
    MYSQL_DATABASE: z.string().default('votesphere'),
  })
  .superRefine((data, ctx) => {
    // 1. If Email Delivery is Enabled, Resend credentials must be configured
    if (data.EMAIL_DELIVERY_ENABLED === 'true') {
      if (!data.RESEND_API_KEY || data.RESEND_API_KEY.startsWith('re_YOUR_') || data.RESEND_API_KEY.startsWith('re_xxxx')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['RESEND_API_KEY'],
          message: 'RESEND_API_KEY must be a valid key when EMAIL_DELIVERY_ENABLED=true',
        });
      }
      if (!data.RESEND_FROM_EMAIL || data.RESEND_FROM_EMAIL.includes('YOUR_VERIFIED_DOMAIN')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['RESEND_FROM_EMAIL'],
          message: 'RESEND_FROM_EMAIL must be configured with a verified domain when EMAIL_DELIVERY_ENABLED=true',
        });
      }
      if (!data.CONTACT_RECIPIENT_EMAIL || data.CONTACT_RECIPIENT_EMAIL.includes('YOUR_REAL_SUPPORT')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['CONTACT_RECIPIENT_EMAIL'],
          message: 'CONTACT_RECIPIENT_EMAIL must be set when EMAIL_DELIVERY_ENABLED=true',
        });
      }
    }

    // 2. Dev login MUST NEVER be enabled in production
    if (data.NODE_ENV === 'production' && data.ENABLE_DEV_LOGIN === 'true') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['ENABLE_DEV_LOGIN'],
        message: 'ENABLE_DEV_LOGIN must never be true when NODE_ENV is production',
      });
    }
  });

/**
 * Validates process.env against schema and returns sanitized env object.
 * In development and build phase, provides sensible defaults if variables are missing.
 * In production runtime with strict checks, logs explicit errors.
 */
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.warn('⚠️ Environment validation notice:', JSON.stringify(parsed.error.format(), null, 2));
    if (
      process.env.NODE_ENV === 'production' &&
      process.env.NEXT_PHASE !== 'phase-production-build'
    ) {
      throw new Error('Invalid environment configuration in production');
    }
  }

  return parsed.success ? parsed.data : { ...envSchema.parse({}), ...process.env };
}

export const env = validateEnv();
