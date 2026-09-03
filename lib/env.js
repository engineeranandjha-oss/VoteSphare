import { z } from 'zod';

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://your-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('your-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('your-service-role-key'),

  // MySQL (InfinityFree / Remote / Local)
  MYSQL_HOST: z.string().default('sql.infinityfree.com'),
  MYSQL_PORT: z.coerce.number().default(3306),
  MYSQL_USER: z.string().default('if0_XXXXXXXX'),
  MYSQL_PASSWORD: z.string().default('your_password'),
  MYSQL_DATABASE: z.string().default('if0_XXXXXXXX_votesphere'),

  // Resend Email
  RESEND_API_KEY: z.string().default('re_xxxxxxxxxxxxxxxx'),

  // App & Environment
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

/**
 * Validates process.env against schema and returns sanitized env object.
 * In development, returns schema parsed defaults if missing.
 * In production, throws error if required keys are missing or invalid.
 */
export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('❌ Invalid environment variables:', parsed.error.format());
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment variables in production');
    }
  }

  return parsed.data || envSchema.parse({});
}

export const env = validateEnv();
