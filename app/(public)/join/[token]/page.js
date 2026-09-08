'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

export default function JoinOrganizationPage() {
  const { token } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [inviteData, setInviteData] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinedSuccess, setJoinedSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch invitation verification details
        const inviteRes = await fetch(`/api/invite/${token}`);
        const inviteJson = await inviteRes.json();

        if (!inviteRes.ok || !inviteJson.success) {
          setError(inviteJson.message || 'Invalid or expired invitation link');
          setLoading(false);
          return;
        }

        setInviteData(inviteJson.data);

        // 2. Fetch current user session
        const sessionRes = await fetch('/api/auth/session');
        const sessionJson = await sessionRes.json();

        if (sessionRes.ok && sessionJson.success && sessionJson.data?.authenticated) {
          setCurrentUser(sessionJson.data.user);
        }
      } catch (err) {
        setError(err.message || 'Failed to verify invitation link');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadData();
    }
  }, [token]);

  const handleGoogleLogin = () => {
    window.location.href = `/api/auth/login?next=${encodeURIComponent(`/join/${token}`)}`;
  };

  const handleAcceptInvite = async () => {
    try {
      setJoining(true);
      setError(null);

      const res = await fetch('/api/orgs/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.message || 'Failed to accept invitation');
        setJoining(false);
        return;
      }

      setJoinedSuccess(true);

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while joining');
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verifying invitation link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg rounded-2xl border border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-xl transition-all">
        {/* Header Icon */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Building2 className="h-9 w-9" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Organization Invitation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            You have been invited to collaborate and vote on VoteSphere.
          </p>
        </div>

        {/* Error View */}
        {error && !joinedSuccess && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="text-sm font-medium">{error}</div>
          </div>
        )}

        {/* Success View */}
        {joinedSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Welcome Aboard!</h2>
            <p className="text-sm text-muted-foreground">
              You are now an active member of <strong>{inviteData?.organization?.name}</strong>.
              Redirecting to your dashboard...
            </p>
          </div>
        ) : inviteData ? (
          <div className="space-y-6">
            {/* Organization Info Card */}
            <div className="rounded-xl border border-border/60 bg-background/50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {inviteData.organization?.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    slug: @{inviteData.organization?.slug}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                  {inviteData.role}
                </span>
              </div>

              {inviteData.organization?.description && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {inviteData.organization.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2 border-t border-border/40 pt-3 text-xs text-muted-foreground">
                <UserCheck className="h-4 w-4 text-primary" />
                <span>
                  Invited email: <strong className="text-foreground">{inviteData.email}</strong>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {currentUser ? (
              <div className="space-y-3">
                <button
                  id="accept-invite-button"
                  onClick={handleAcceptInvite}
                  disabled={joining}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-all duration-200 hover:opacity-90 disabled:opacity-60"
                >
                  {joining ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Joining Organization...</span>
                    </>
                  ) : (
                    <>
                      <span>Accept Invitation & Join</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Signed in as <strong>{currentUser.email}</strong>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  id="signin-to-join-button"
                  onClick={handleGoogleLogin}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
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
                  <span>Sign in with Google to Accept</span>
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  You will return here immediately after authentication.
                </p>
              </div>
            )}
          </div>
        ) : null}

        {/* Footer */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary/80" />
          <span>Encrypted Invitation Token via VoteSphere Security</span>
        </div>
      </div>
    </div>
  );
}
