'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useState, useId } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  UserCheck2,
  ArrowLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sanitizeRedirectUrl } from '@/lib/auth/security';
import Logo from '@/components/common/Logo';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next') || '/dashboard';
  const targetRedirect = sanitizeRedirectUrl(rawRedirect, '/dashboard');

  // View state: 'login_password' | 'login_magic_link' | 'forgot_password'
  const [authView, setAuthView] = useState('login_password');

  // Form inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [formError, setFormError] = useState('');
  const [demoLoading, setDemoLoading] = useState(false);

  // Accessibility IDs
  const emailId = useId();
  const passwordId = useId();
  const forgotEmailId = useId();

  // Development login condition
  const showDevSwitcher =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

  const handleGoogleLogin = () => {
    setLoadingGoogle(true);
    window.location.href = `/api/auth/login?next=${encodeURIComponent(targetRedirect)}`;
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    startGlobalProgress();

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        // Generic error message to prevent account enumeration
        setFormError('Invalid email or password. Please check your credentials.');
        return;
      }

      if (data?.session) {
        router.push(targetRedirect);
        router.refresh();
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred during login.');
    } finally {
      setSubmitting(false);
      completeGlobalProgress();
    }
  };

  const handleMagicLink = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    startGlobalProgress();

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(targetRedirect)}`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (otpError) {
        if (otpError.message.includes('fetch') || otpError.message.includes('configured')) {
          setFormError('Email service not configured in this environment. Please use Google Sign In or Email + Password.');
        } else {
          setFormError(otpError.message);
        }
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to send login link. Try again.');
    } finally {
      setSubmitting(false);
      completeGlobalProgress();
    }
  };

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    startGlobalProgress();

    try {
      const supabase = createClient();
      const redirectUrl = `${window.location.origin}/auth/reset-password`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (resetError) {
        // Generic handling to avoid leaking email existence
        if (resetError.message.includes('fetch') || resetError.message.includes('configured')) {
          setFormError('Password recovery service not configured in this environment.');
        } else {
          // Even on unknown error, show success or generic notice
          setResetEmailSent(true);
        }
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to dispatch password recovery email.');
    } finally {
      setSubmitting(false);
      completeGlobalProgress();
    }
  };

  const handleDemoLogin = (role) => {
    setDemoLoading(true);
    setFormError('');
    try {
      if (role === 'admin' || role === 'organizer') {
        router.push(targetRedirect);
      } else {
        router.push(targetRedirect === '/dashboard' ? '/voter' : targetRedirect);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to initialize demo session.');
      setDemoLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg rounded-3xl border border-border/80 bg-card/95 p-8 shadow-2xl backdrop-blur-2xl transition-all duration-300">
      {/* Brand & Title Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex justify-center">
          <Logo size={60} priority className="shadow-lg shadow-blue-500/20" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          {authView === 'forgot_password' ? (
            'Reset Password'
          ) : (
            <>
              Welcome to <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">VoteSphere</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {authView === 'forgot_password'
            ? 'Enter your registered email address to receive password recovery instructions.'
            : 'Sign in to access your organization workspace, manage elections, or vote.'}
        </p>
      </div>

      {/* URL or Form Error Alert */}
      {(errorParam || formError) && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm font-medium">
            {formError ||
              (errorParam === 'auth_callback_failed'
                ? 'Authentication was cancelled or failed. Please try again.'
                : decodeURIComponent(errorParam))}
          </div>
        </div>
      )}

      {/* View: Password Recovery Email Sent */}
      {resetEmailSent ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in zoom-in-95">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Password Recovery Dispatched</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            If an account is associated with <strong className="text-foreground">{email}</strong>, a secure password reset link has been dispatched to your inbox.
          </p>
          <button
            type="button"
            onClick={() => {
              setResetEmailSent(false);
              setAuthView('login_password');
            }}
            className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-primary underline hover:text-primary/80"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Sign In</span>
          </button>
        </div>
      ) : magicLinkSent ? (
        /* View: Magic Link Sent */
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in zoom-in-95">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Magic Link Dispatched!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a secure one-click sign in link to <strong className="text-foreground">{email}</strong>. Check your inbox to proceed.
          </p>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="mt-5 text-xs font-semibold text-primary underline hover:text-primary/80"
          >
            Use a different email or method
          </button>
        </div>
      ) : authView === 'forgot_password' ? (
        /* View: Forgot Password Form */
        <div className="space-y-4">
          <form onSubmit={handlePasswordRecovery} className="space-y-4">
            <div>
              <label htmlFor={forgotEmailId} className="block text-xs font-semibold text-foreground mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  id={forgotEmailId}
                  type="email"
                  placeholder="name@organization.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              aria-busy={submitting ? 'true' : undefined}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Sending Reset Link...</span>
                </>
              ) : (
                <>
                  <span>Send Password Reset Link</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setFormError('');
                setAuthView('login_password');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Sign In</span>
            </button>
          </div>
        </div>
      ) : (
        /* View: Sign In Options */
        <div className="space-y-5">
          {/* Google OAuth Button */}
          <button
            id="google-signin-button"
            type="button"
            onClick={handleGoogleLogin}
            disabled={loadingGoogle || submitting || demoLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-2xl border border-border/80 bg-background/90 px-5 py-3 text-sm font-bold text-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:bg-muted/60 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingGoogle ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{loadingGoogle ? 'Connecting to Google OAuth...' : 'Continue with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-border/70" />
            <span className="absolute bg-card px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Or sign in with email
            </span>
          </div>

          {/* Method Selector Tabs */}
          <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthView('login_password')}
              className={`flex-1 rounded-lg py-1.5 transition-all ${
                authView === 'login_password'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Email + Password
            </button>
            <button
              type="button"
              onClick={() => setAuthView('login_magic_link')}
              className={`flex-1 rounded-lg py-1.5 transition-all ${
                authView === 'login_magic_link'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Magic Link
            </button>
          </div>

          {authView === 'login_password' ? (
            /* Email + Password Form */
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor={emailId} className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id={emailId}
                    type="email"
                    placeholder="name@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={passwordId} className="block text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setFormError('');
                      setAuthView('forgot_password');
                    }}
                    className="text-[11px] font-semibold text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id={passwordId}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || loadingGoogle || demoLoading}
                aria-busy={submitting ? 'true' : undefined}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Magic Link Form */
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={submitting || loadingGoogle || demoLoading}
                aria-busy={submitting ? 'true' : undefined}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending Magic Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Passwordless Magic Link</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Test Personas - strictly guarded by environment */}
          {showDevSwitcher && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Development Test Switcher</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Development-only test route launchers:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  disabled={demoLoading}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-left text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/10 transition-colors"
                >
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-bold">Org Admin</div>
                    <div className="text-[10px] text-muted-foreground">Manage Workspace</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('voter')}
                  disabled={demoLoading}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-left text-xs font-semibold text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                >
                  <UserCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Verified Voter</div>
                    <div className="text-[10px] text-muted-foreground">Cast & Verify Ballot</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Switch to Signup */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account yet?{' '}
        <Link
          href={`/auth/signup?next=${encodeURIComponent(targetRedirect)}`}
          className="font-bold text-primary hover:underline"
        >
          Create an account
        </Link>
      </div>

      {/* Privacy & Zero-Knowledge Security Footer */}
      <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary/80" />
        <span>Supabase Auth Protected • 256-bit Cryptographic Identity</span>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[450px] w-[450px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-1/4 -left-20 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute bottom-1/4 -right-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      <Suspense
        fallback={
          <div className="flex h-96 w-full max-w-lg items-center justify-center rounded-3xl border border-border bg-card/60">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
