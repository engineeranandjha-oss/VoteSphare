'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ImageUpload from '@/components/common/ImageUpload';
import SlugInput from '@/components/orgs/SlugInput';
import {
  Building2,
  Palette,
  Globe,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  CreditCard,
} from 'lucide-react';
import Link from 'next/link';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

const ORG_TYPES = [
  { id: 'university', label: 'University / College', icon: '🎓' },
  { id: 'school', label: 'School / Academy', icon: '🏫' },
  { id: 'company', label: 'Company / Corporate', icon: '💼' },
  { id: 'student_council', label: 'Student Council / Union', icon: '🏛️' },
  { id: 'society', label: 'Club / Society', icon: '🏆' },
  { id: 'ngo', label: 'Non-Profit / NGO', icon: '🤝' },
  { id: 'other', label: 'Other Organization', icon: '🌐' },
];

export default function OrgSettingsPage() {
  const router = useRouter();
  const { orgId } = useParams();

  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'university',
    description: '',
    logo: '',
  });

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchOrgDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/orgs/${orgId}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to fetch organization settings');
      }

      const orgData = json.data;
      setOrg(orgData);
      setFormData({
        name: orgData.name || '',
        slug: orgData.slug || '',
        type: orgData.type || 'university',
        description: orgData.description || '',
        logo: orgData.logo || '',
      });
    } catch (err) {
      setError(err.message || 'Error loading organization settings');
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchOrgDetails();
  }, [fetchOrgDetails]);

  async function handleSave(e) {
    e?.preventDefault();
    if (!formData.name.trim()) {
      setError('Organization name is required.');
      return;
    }
    if (!formData.slug.trim()) {
      setError('Workspace URL slug is required.');
      return;
    }

    try {
      setSaving(true);
      startGlobalProgress();
      setError(null);
      setSuccessMsg(null);

      const res = await fetch(`/api/orgs/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          type: formData.type,
          description: formData.description.trim() || null,
          logo: formData.logo ? formData.logo.trim() : null,
        }),
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        throw new Error(`Server returned error (${res.status})`);
      }

      if (!res.ok) {
        const errorDetail = Array.isArray(json.errors)
          ? json.errors.map((err) => err.message || err.field || err).join(', ')
          : null;
        throw new Error(errorDetail || json.message || 'Failed to save settings');
      }

      setOrg(json.data);
      setSuccessMsg('Organization settings updated successfully.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'An error occurred while saving organization settings');
    } finally {
      setSaving(false);
      completeGlobalProgress();
    }
  }

  async function handleDeleteOrg() {
    if (deleteConfirmationText !== org?.slug && deleteConfirmationText !== org?.name) {
      setDeleteError('Please type the exact organization name or slug to confirm.');
      return;
    }

    try {
      setDeleting(true);
      startGlobalProgress();
      setDeleteError(null);

      const res = await fetch(`/api/orgs/${orgId}`, {
        method: 'DELETE',
      });

      let json = {};
      try {
        json = await res.json();
      } catch {
        // Ignored if 204/200
      }

      if (!res.ok) {
        throw new Error(json.message || 'Failed to delete organization');
      }

      router.push('/dashboard');
    } catch (err) {
      setDeleteError(err.message || 'An error occurred while deleting organization');
      setDeleting(false);
    } finally {
      completeGlobalProgress();
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-14 bg-slate-900 rounded-2xl w-full animate-pulse" />
          <div className="h-96 bg-slate-900 rounded-3xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error && !org) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Settings Unavailable</h2>
          <p className="text-xs text-slate-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => fetchOrgDetails()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-xs text-white transition-all"
            >
              Retry
            </button>
            <Link
              href={`/org/${orgId}/dashboard`}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-xs text-slate-300 transition-all"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!loading && org && org.userRole !== 'owner' && org.userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
        <DashboardHeader org={org} />
        <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-16 text-center">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-2xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Access Restricted</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              You are signed in as a voter in this organization. Organization settings and administrative configurations can only be managed by owners and admins.
            </p>
            <div className="pt-4">
              <Link
                href={`/org/${orgId}/dashboard`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-blue-500/20"
              >
                Return to Workspace Dashboard
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isOwner = org?.userRole === 'owner';
  const publicPortalUrl = `/org/${org?.slug || orgId}`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      {/* Header Bar */}
      <DashboardHeader org={org} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
              <Building2 className="h-6 w-6 text-blue-500" />
              Organization Settings & Branding
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure workspace identity, public portal appearance, and organizational governance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={publicPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
            >
              <Globe className="h-4 w-4 text-blue-400" />
              <span>View Portal</span>
              <ExternalLink className="h-3 w-3 text-slate-500" />
            </a>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              aria-busy={saving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Settings...
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 flex items-center gap-2.5 shadow-lg">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 flex items-center gap-2.5 shadow-lg">
            <span className="text-sm">✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: General Identity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              Workspace Identity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The primary branding and URL identifier for your organization.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Organization Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Acme Voting Union"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>

            <SlugInput
              value={formData.slug}
              onChange={(slug) => setFormData((prev) => ({ ...prev, slug }))}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Organization Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ORG_TYPES.map((t) => {
                  const isSelected = formData.type === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, type: t.id }))}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white font-bold shadow-md shadow-blue-500/10'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/80 font-medium'
                      }`}
                    >
                      <span className="text-base">{t.icon}</span>
                      <span className="text-xs truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Description / Mission Statement
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your organization's purpose, democracy values, and governance scope..."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Visual Branding & Logo */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Palette className="h-4 w-4 text-purple-400" />
              Visual Branding & Badge
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload your organization insignia, crest, or brand badge. Displayed across voter ballots and certificates.
            </p>
          </div>

          <div>
            <ImageUpload
              label="Organization Logo"
              value={formData.logo}
              onChange={(val) => setFormData((prev) => ({ ...prev, logo: val || '' }))}
              helperText="Upload a square PNG, JPG, or WebP logo. Automatically compressed on device."
            />
          </div>
        </div>

        {/* Section 3: Public Portal Integration */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-400" />
              Public Portal Link
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Your community can view active ballots, past certified results, and verify elections on your vanity URL.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Canonical Vanity Portal
              </div>
              <div className="text-sm font-mono font-bold text-white mt-1">
                votesphere.com/org/{formData.slug || orgId}
              </div>
            </div>

            <a
              href={publicPortalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-xs font-bold text-blue-400 transition-all flex items-center gap-1.5"
            >
              <span>Visit Portal</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Section 4: Subscription & Billing */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl backdrop-blur-md">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-400" />
              Subscription & Billing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage your commercial tier, monitor monthly election quotas, and download GST tax invoices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Billing Center
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Access usage progress meters, upgrade plans, or download PDF receipts.
              </div>
            </div>

            <Link
              href={`/org/${orgId}/billing`}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-blue-500/20"
            >
              <span>Manage Billing</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Section 5: Danger Zone */}
        <div className="bg-rose-950/20 border border-rose-900/40 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <div className="border-b border-rose-900/30 pb-4">
            <h2 className="text-base font-bold text-rose-300 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              Danger Zone
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Destructive actions cannot be reversed. Only the organization Owner can delete this workspace.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-rose-900/30">
            <div>
              <div className="text-sm font-bold text-white">Delete this Organization</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Permanently deletes this workspace, all associated elections, ballot records, and member rosters.
              </div>
            </div>

            <button
              type="button"
              disabled={!isOwner}
              onClick={() => setDeleteModalOpen(true)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isOwner
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete Workspace
            </button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="max-w-md w-full bg-slate-900 border border-rose-900/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto text-xl font-bold">
                ⚠️
              </div>
              <h3 className="text-lg font-bold text-white">Are you absolutely sure?</h3>
              <p className="text-xs text-slate-400">
                This will permanently delete <strong className="text-white">{org?.name}</strong> and all of its associated elections, candidate manifestos, and voting results.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
                {deleteError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Type <strong className="text-rose-300">{org?.slug}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder={org?.slug}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-rose-900/50 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                  setDeleteError(null);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || (deleteConfirmationText !== org?.slug && deleteConfirmationText !== org?.name)}
                aria-busy={deleting}
                onClick={handleDeleteOrg}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 font-bold text-xs text-white transition-all flex items-center gap-1.5"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting Workspace...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
