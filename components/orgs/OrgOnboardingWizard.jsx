'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SlugInput from './SlugInput';
import ImageUpload from '@/components/common/ImageUpload';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';
import {
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Mail,
  Shield,
  Palette,
  Loader2,
} from 'lucide-react';

const ORG_TYPES = [
  { id: 'university', label: 'University / College', icon: '🎓' },
  { id: 'student_council', label: 'Student Council / Union', icon: '🏛️' },
  { id: 'club', label: 'Club / Society', icon: '🏆' },
  { id: 'nonprofit', label: 'Non-Profit / NGO', icon: '🤝' },
  { id: 'corporate', label: 'Corporate / Enterprise', icon: '💼' },
  { id: 'other', label: 'Other Organization', icon: '🌐' },
];

export default function OrgOnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'university',
    description: '',
    logo: '',
    contactEmail: '',
    timezone: 'UTC',
  });

  // Invites State
  const [invites, setInvites] = useState([]);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInviteRole, setNewInviteRole] = useState('admin');
  const [inviteError, setInviteError] = useState(null);

  // Auto-slugify when name changes if user hasn't explicitly edited slug
  function handleNameChange(e) {
    const name = e.target.value;
    const currentSlugIsAuto =
      !formData.slug ||
      formData.slug ===
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9-]/g, '-')
          .replace(/-+/g, '-');

    setFormData((prev) => ({
      ...prev,
      name,
      slug: currentSlugIsAuto
        ? name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-/, '')
        : prev.slug,
    }));
  }

  function handleAddInvite() {
    setInviteError(null);
    const email = newInviteEmail.trim();

    if (!email || !email.includes('@')) {
      setInviteError('Please provide a valid email address.');
      return;
    }

    if (invites.some((inv) => inv.email.toLowerCase() === email.toLowerCase())) {
      setInviteError('This email is already in the invitation list.');
      return;
    }

    setInvites((prev) => [...prev, { email, role: newInviteRole }]);
    setNewInviteEmail('');
  }

  function handleRemoveInvite(indexToRemove) {
    setInvites((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  }

  function validateStep1() {
    if (!formData.name.trim()) {
      setError('Organization name is required.');
      return false;
    }
    if (!formData.slug.trim()) {
      setError('Workspace URL slug is required.');
      return false;
    }
    setError(null);
    return true;
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return;
    setError(null);
    setStep((prev) => Math.min(prev + 1, 3));
  }

  function handleBack() {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  }

  async function handleSubmit() {
    try {
      setSubmitting(true);
      startGlobalProgress();
      setError(null);

      // 1. Create Organization via API
      const res = await fetch('/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          type: formData.type || 'university',
          description: formData.description.trim() || null,
          logo: formData.logo ? formData.logo.trim() : null,
          config: {
            contactEmail: formData.contactEmail.trim() || null,
            timezone: formData.timezone,
          },
        }),
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server returned error (${res.status}). Please try again.`);
      }

      if (!res.ok) {
        const errorDetail = Array.isArray(json.errors)
          ? json.errors.map((e) => e.message || e.field || e).join(', ')
          : null;
        throw new Error(errorDetail || json.message || 'Failed to create organization');
      }

      const createdOrg = json.data;

      // 2. Dispatch Invitations if any were added
      if (invites.length > 0) {
        for (const invite of invites) {
          try {
            await fetch(`/api/orgs/${createdOrg.id}/members/invite`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(invite),
            });
          } catch {
            // Non-blocking: continue with remaining invitations
          }
        }
      }

      // 3. Redirect to new organization dashboard
      router.push(`/org/${createdOrg.id}/dashboard`);
    } catch (err) {
      setError(err.message || 'An error occurred during organization creation');
      setSubmitting(false);
    } finally {
      completeGlobalProgress();
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8">
      {/* Step Progress Indicators */}
      {/* Desktop / Tablet: 3-Card Grid */}
      <div className="hidden sm:grid grid-cols-3 gap-3">
        {[
          { num: 1, label: 'Workspace Identity', icon: Building2 },
          { num: 2, label: 'Branding & Details', icon: Palette },
          { num: 3, label: 'Team & Launch', icon: Shield },
        ].map((s) => {
          const IconComponent = s.icon;
          const isActive = step === s.num;
          const isComplete = step > s.num;

          return (
            <div
              key={s.num}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                isActive
                  ? 'bg-blue-600/10 border-blue-500 shadow-lg shadow-blue-500/10'
                  : isComplete
                    ? 'bg-slate-900 border-emerald-500/30'
                    : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isActive
                      ? 'bg-blue-500 text-white'
                      : isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isComplete ? '✓' : <IconComponent className="h-3.5 w-3.5" />}
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] text-slate-400 font-medium">Step {s.num}</div>
                  <div className="text-xs font-bold text-white truncate">{s.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Compact Responsive Step Progress Bar */}
      <div className="sm:hidden bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-white flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-500 text-white text-xs font-black">
              {step}
            </span>
            <span>
              {step === 1 && 'Workspace Identity'}
              {step === 2 && 'Branding & Details'}
              {step === 3 && 'Team & Launch'}
            </span>
          </span>
          <span className="text-slate-400 font-medium text-[11px]">Step {step} of 3</span>
        </div>

        {/* 3-Segment Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 h-1.5 w-full">
          <div className={`rounded-full ${step >= 1 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`rounded-full ${step >= 2 ? 'bg-blue-500' : 'bg-slate-800'}`} />
          <div className={`rounded-full ${step >= 3 ? 'bg-blue-500' : 'bg-slate-800'}`} />
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-xl">
        {error && (
          <div className="mb-6 p-3.5 sm:p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5">
            <span className="text-base shrink-0">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Workspace Identity */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Create Your Organization Workspace
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Set up the primary identity for your democratic voting community.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Organization Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleNameChange}
                  placeholder="e.g. Stanford Student Association, Acme Corp"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <SlugInput
                value={formData.slug}
                onChange={(slug) => setFormData((prev) => ({ ...prev, slug }))}
              />

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Organization Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                  {ORG_TYPES.map((t) => {
                    const isSelected = formData.type === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: t.id }))}
                        className={`p-3 sm:p-3.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 min-h-[52px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${
                          isSelected
                            ? 'bg-blue-600/15 border-blue-500 text-white font-bold shadow-md shadow-blue-500/10 ring-1 ring-blue-500/30'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xl shrink-0 select-none">{t.icon}</span>
                          <span className="text-xs sm:text-sm font-semibold leading-tight">{t.label}</span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 shadow-sm shadow-blue-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Description / Mission <span className="text-slate-500 lowercase font-normal">(optional)</span>
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Briefly describe the purpose of this organization..."
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Branding & Details */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Branding & Operational Preferences
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Customize visual appearance and default contact settings.
              </p>
            </div>

            <div className="space-y-4 sm:space-y-5">
              <ImageUpload
                label="Organization Logo / Badge"
                value={formData.logo}
                onChange={(val) => setFormData((prev) => ({ ...prev, logo: val || '' }))}
                helperText="PNG, JPG, WEBP, or SVG (square or round recommended)"
              />

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Official Contact Email <span className="text-slate-500 lowercase font-normal">(optional)</span>
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))}
                  placeholder="elections@organization.org"
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Timezone
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="America/New_York">Eastern Time (US & Canada)</option>
                  <option value="America/Chicago">Central Time (US & Canada)</option>
                  <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
                  <option value="Europe/London">London (GMT / BST)</option>
                  <option value="Europe/Paris">Paris, Berlin, Rome (CET)</option>
                  <option value="Asia/Kolkata">India Standard Time (IST)</option>
                  <option value="Asia/Tokyo">Tokyo Standard Time (JST)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Team Invites & Final Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
                Invite Co-Administrators & Launch
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 leading-relaxed">
                Add initial team members to help organize ballots and manage voter rosters.
              </p>
            </div>

            {/* Add Team Member Input Group */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                <div className="flex-1 relative">
                  <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    value={newInviteEmail}
                    onChange={(e) => setNewInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInvite())}
                    placeholder="teammate@organization.org"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>

                <select
                  value={newInviteRole}
                  onChange={(e) => setNewInviteRole(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="admin">Admin (Full Control)</option>
                  <option value="manager">Manager (Election Creator)</option>
                  <option value="voter">Voter (Elector)</option>
                </select>

                <button
                  type="button"
                  onClick={handleAddInvite}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-sm text-white transition-all flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              {inviteError && <p className="text-xs text-rose-400">{inviteError}</p>}
            </div>

            {/* Invited Members Chip List */}
            {invites.length > 0 && (
              <div className="space-y-2">
                <div className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Pending Invitations ({invites.length})
                </div>
                <div className="space-y-2">
                  {invites.map((inv, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 gap-2"
                    >
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="text-xs sm:text-sm font-semibold text-white truncate">{inv.email}</span>
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                          {inv.role}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveInvite(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                        title="Remove Invitation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Organization Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">
                  Ready to Launch
                </div>
                <div className="text-base font-bold text-white mt-0.5">{formData.name}</div>
                <div className="text-xs text-slate-400 font-mono break-all">
                  votesphere.com/org/{formData.slug}
                </div>
              </div>
              <span className="text-2xl self-end sm:self-center select-none">🚀</span>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="mt-8 pt-6 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {step > 1 ? (
            <button
              type="button"
              disabled={submitting}
              onClick={handleBack}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-sm text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div className="hidden sm:block" />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold text-sm text-white shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              Next Step <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmit}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-sm text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Workspace...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Create & Launch Workspace
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
