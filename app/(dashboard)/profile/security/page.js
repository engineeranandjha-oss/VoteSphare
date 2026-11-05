'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Lock,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { createClient } from '@/lib/supabase/client';

export default function AccountSecurityPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  // Password Update Form
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          setProfile(json.data);
        }
      } catch (err) {
        // Fallback
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCopyFingerprint = () => {
    if (profile?.cryptographicFingerprint) {
      navigator.clipboard.writeText(profile.cryptographicFingerprint);
      setCopiedFingerprint(true);
      setTimeout(() => setCopiedFingerprint(false), 2500);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setUpdatingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(false);

      const supabase = createClient();
      const { error: sbError } = await supabase.auth.updateUser({
        password,
      });

      if (sbError) {
        throw new Error(sbError.message);
      }

      setPasswordSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch (err) {
      setPasswordError(err.message || 'Error updating password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading account security details...</p>
      </div>
    );
  }

  const email = profile?.user?.email || user?.email || '';
  const authProvider = user?.appMetadata?.provider || 'Email / Credentials';

  return (
    <div className="space-y-6">
      {/* Voter Fingerprint Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-6 sm:p-7 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Cryptographic Voter Identity Fingerprint
            </h2>
            <p className="text-xs text-slate-400">
              One-way blind hash used to verify ballot participation while keeping your vote anonymous
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Blind Hash Identifier
          </div>
          <div className="font-mono text-xs sm:text-sm text-emerald-400 break-all select-all font-semibold">
            {profile?.cryptographicFingerprint || 'Generating hash...'}
          </div>

          <div className="pt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <FileCheck className="w-3.5 h-3.5 text-emerald-500" />
              Verified SHA-256 Electoral Blind Token
            </span>

            <button
              onClick={handleCopyFingerprint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
            >
              {copiedFingerprint ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Fingerprint</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
          <strong className="text-slate-300">Constitutional Anonymity Guarantee: </strong>
          Your cryptographic voter fingerprint prevents duplicate voting without recording which candidate
          you selected. Neither organization managers nor system administrators can inspect the ballot
          associated with your voter fingerprint.
        </div>
      </div>

      {/* Account Authentication & Password Update */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-6 sm:p-7 shadow-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Authentication Credentials & Security
            </h2>
            <p className="text-xs text-slate-400">
              Manage your password and inspect account authentication status
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">
              Registered Email
            </span>
            <span className="font-semibold text-white mt-0.5 block">{email}</span>
          </div>

          <div>
            <span className="text-slate-500 uppercase tracking-wider text-[10px] block">
              Authentication Method
            </span>
            <span className="font-semibold text-white mt-0.5 capitalize block">
              {authProvider}
            </span>
          </div>
        </div>

        {/* Change Password Form */}
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Update Account Password
          </h3>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>Your account password has been successfully updated.</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirm New Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={updatingPassword || !password}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {updatingPassword ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

