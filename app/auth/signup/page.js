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
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Building2,
  UserCheck2,
  KeyRound,
  Check,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { sanitizeRedirectUrl, evaluatePasswordPolicy } from '@/lib/auth/security';
import Logo from '@/components/common/Logo';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');
  const rawRedirect = searchParams.get('redirect') || searchParams.get('next') || '/onboarding';
  const targetRedirect = sanitizeRedirectUrl(rawRedirect, '/onboarding');

  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'magic_link'
  const [accountType, setAccountType] = useState('organizer'); // 'organizer' | 'voter'

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [submitting, setSubmitting] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // Unique IDs for accessibility
  const fullNameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  // Password Policy Analysis
  const passwordPolicy = evaluatePasswordPolicy(password);

  // Development Login condition
  const showDevSwitcher =
    process.env.NODE_ENV === 'development' &&
    process.env.NEXT_PUBLIC_ENABLE_DEV_LOGIN === 'true';

  const handleGoogleSignup = () => {
    setLoadingGoogle(true);
    const destination = accountType === 'organizer' ? '/onboarding' : targetRedirect;
    window.location.href = `/api/auth/login?next=${encodeURIComponent(destination)}`;
  };

  const handlePasswordSignup = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }

    if (!email || !email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long (12+ recommended).');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match. Please verify your password.');
      return;
    }

    setSubmitting(true);
    startGlobalProgress();

    try {
      const supabase = createClient();
      const destination = accountType === 'organizer' ? '/onboarding' : targetRedirect;
      const callbackUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(destination)}`;

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            full_name: fullName.trim(),
            name: fullName.trim(),
            account_type: accountType,
          },
        },
      });

      if (signUpError) {
        // Keep error messages generic or user-friendly
        if (signUpError.message.includes('already registered')) {
          setFormError('An account with this email may already exist. Try signing in instead.');
        } else {
          setFormError(signUpError.message || 'Failed to create account. Please try again.');
        }
        return;
      }

      // If user is auto-confirmed or session is returned
      if (data?.session) {
        router.push(destination);
      } else {
        // Email confirmation is required
        setConfirmationSent(true);
      }
    } catch (err) {
      setFormError(err.message || 'An unexpected error occurred during signup.');
    } finally {
      setSubmitting(false);
      completeGlobalProgress();
    }
  };

  const handleMagicLinkSignup = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !email.includes('@')) {
      setFormError('Please provide a valid email address.');
      return;
    }

    setSubmitting(true);
    startGlobalProgress();

    try {
      const supabase = createClient();
      const destination = accountType === 'organizer' ? '/onboarding' : targetRedirect;
      const redirectUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(destination)}`;

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName.trim() || undefined,
            account_type: accountType,
          },
        },
      });

      if (otpError) {
        if (otpError.message.includes('fetch') || otpError.message.includes('configured')) {
          setFormError('Email service not configured in this environment. Please use Google Sign Up or Email + Password.');
        } else {
          setFormError(otpError.message);
        }
      } else {
        setMagicLinkSent(true);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to initialize passwordless signup.');
    } finally {
      setSubmitting(false);
      completeGlobalProgress();
    }
  };

  const handleDemoSignup = (role) => {
    setDemoLoading(true);
    if (role === 'organizer') {
      router.push('/onboarding');
    } else {
      router.push(targetRedirect === '/onboarding' ? '/voter' : targetRedirect);
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
          Create <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">VoteSphere</span> Account
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join the zero-knowledge verifiable voting platform.
        </p>
      </div>

      {/* Account Type Selector */}
      <div className="mb-5 grid grid-cols-2 gap-3 rounded-2xl border border-border/80 bg-muted/30 p-1.5">
        <button
          type="button"
          onClick={() => setAccountType('organizer')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            accountType === 'organizer'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4 text-primary" />
          <span>Organization Admin</span>
        </button>

        <button
          type="button"
          onClick={() => setAccountType('voter')}
          className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
            accountType === 'voter'
              ? 'bg-card text-foreground shadow-sm border border-border/80'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <UserCheck2 className="h-4 w-4 text-emerald-600" />
          <span>Voter Account</span>
        </button>
      </div>

      {/* Error Banner */}
      {(errorParam || formError) && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-in fade-in slide-in-from-top-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm font-medium">
            {formError || decodeURIComponent(errorParam)}
          </div>
        </div>
      )}

      {/* Email Confirmation Success State (Password Signup) */}
      {confirmationSent ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in zoom-in-95">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <Mail className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Verify Your Email Address</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            We have sent a verification confirmation email to{' '}
            <strong className="text-foreground font-semibold">{email}</strong>.
          </p>
          <div className="my-4 rounded-xl border border-border/80 bg-background/60 p-3 text-left text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Next Steps:</p>
            <p>1. Open your inbox and click the verification link.</p>
            <p>2. Verified accounts are required before you can create elections or cast ballots.</p>
            <p>3. If you don&apos;t see it, check your spam or junk folder.</p>
          </div>
          <Link
            href={`/auth/login?next=${encodeURIComponent(targetRedirect)}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:bg-primary/90 transition-all"
          >
            <span>Proceed to Sign In</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : magicLinkSent ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center animate-in zoom-in-95">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h2 className="text-lg font-bold text-foreground">Magic Link Dispatched!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent an activation link to <strong className="text-foreground">{email}</strong>. Click the link in your email to sign in.
          </p>
          <button
            type="button"
            onClick={() => setMagicLinkSent(false)}
            className="mt-5 text-xs font-semibold text-primary underline hover:text-primary/80"
          >
            Use a different email or method
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Google OAuth Button */}
          <button
            id="google-signup-button"
            type="button"
            onClick={handleGoogleSignup}
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
            <span>{loadingGoogle ? 'Connecting...' : 'Sign up with Google'}</span>
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-border/70" />
            <span className="absolute bg-card px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Or with email credentials
            </span>
          </div>

          {/* Method Sub-Tabs */}
          <div className="flex rounded-xl bg-muted/40 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMethod('password')}
              className={`flex-1 rounded-lg py-1.5 transition-all ${
                authMethod === 'password'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Email + Password
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod('magic_link')}
              className={`flex-1 rounded-lg py-1.5 transition-all ${
                authMethod === 'magic_link'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Passwordless Magic Link
            </button>
          </div>

          {authMethod === 'password' ? (
            /* Email + Password Form */
            <form onSubmit={handlePasswordSignup} className="space-y-4">
              {/* Full Name */}
              <div>
                <label htmlFor={fullNameId} className="block text-xs font-semibold text-foreground mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id={fullNameId}
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label htmlFor={emailId} className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id={emailId}
                    type="email"
                    placeholder="jane@organization.org"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={passwordId} className="block text-xs font-semibold text-foreground">
                    Password
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    At least 12 characters recommended
                  </span>
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

                {/* Password Policy Helpers */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {passwordPolicy.hasRecommendedLength ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : passwordPolicy.hasLength ? (
                        <span className="text-amber-500 font-medium">●</span>
                      ) : (
                        <X className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <span
                        className={
                          passwordPolicy.hasRecommendedLength
                            ? 'text-emerald-500'
                            : passwordPolicy.hasLength
                            ? 'text-amber-500'
                            : 'text-muted-foreground'
                        }
                      >
                        {passwordPolicy.hasRecommendedLength
                          ? 'Strong length (12+ characters)'
                          : 'Minimum 8 characters (12+ recommended)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor={confirmPasswordId} className="block text-xs font-semibold text-foreground mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    id={confirmPasswordId}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="mt-1 text-[11px] text-destructive">Passwords do not match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || loadingGoogle || demoLoading}
                aria-busy={submitting ? 'true' : undefined}
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-200 hover:bg-primary/90 hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create {accountType === 'organizer' ? 'Organization' : 'Voter'} Account</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Magic Link Form */
            <form onSubmit={handleMagicLinkSignup} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-border/80 bg-background/80 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="voter@organization.org"
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
                    <span>Sending Activation Link...</span>
                  </>
                ) : (
                  <>
                    <span>Send Activation Link</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Fast Test & Evaluation Switcher - strictly guarded by environment */}
          {showDevSwitcher && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Development Test Personas</span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Development-only test route launchers:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDemoSignup('organizer')}
                  disabled={demoLoading}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-left text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary/10 transition-colors"
                >
                  <Building2 className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <div className="font-bold">New Org Wizard</div>
                    <div className="text-[10px] text-muted-foreground">Launch Onboarding</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoSignup('voter')}
                  disabled={demoLoading}
                  className="flex items-center gap-2 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-left text-xs font-semibold text-foreground hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-colors"
                >
                  <UserCheck2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Voter Dashboard</div>
                    <div className="text-[10px] text-muted-foreground">Preview Voter Hub</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Switch to Login */}
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link
          href={`/auth/login?next=${encodeURIComponent(targetRedirect)}`}
          className="font-bold text-primary hover:underline"
        >
          Sign in
        </Link>
      </div>

      {/* Privacy & Zero-Knowledge Security Footer */}
      <div className="mt-6 flex items-center justify-center gap-2 border-t border-border/60 pt-4 text-[11px] text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary/80" />
        <span>Supabase Auth Protected • Passwords Never Stored in Database</span>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div className="h-[450px] w-[450px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute top-1/4 -right-20 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px]" />
        <div className="absolute bottom-1/4 -left-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-[80px]" />
      </div>

      <Suspense
        fallback={
          <div className="flex h-96 w-full max-w-lg items-center justify-center rounded-3xl border border-border bg-card/60">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </div>
  );
}
