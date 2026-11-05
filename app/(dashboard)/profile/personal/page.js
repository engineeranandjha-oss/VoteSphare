'use client';

import { useState, useEffect } from 'react';
import {
  IdCard,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import ImageUpload from '@/components/common/ImageUpload';
import { startGlobalProgress, completeGlobalProgress } from '@/components/common/GlobalProgressProvider';

export default function PersonalInfoPage() {
  const { refresh: refreshAuth } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [designation, setDesignation] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState('');

  // Privacy Switches
  const [showEmailPublicly, setShowEmailPublicly] = useState(false);
  const [showPhonePublicly, setShowPhonePublicly] = useState(false);
  const [isProfilePublic, setIsProfilePublic] = useState(true);
  const [avatarVisible, setAvatarVisible] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          const u = json.data?.user || {};
          setName(u.name || '');
          setDisplayName(u.displayName || '');
          setDesignation(u.designation || '');
          setBio(u.bio || '');
          setPhone(u.phone || '');
          setEmail(u.email || '');
          setImage(u.image || '');
          setShowEmailPublicly(Boolean(u.showEmailPublicly));
          setShowPhonePublicly(Boolean(u.showPhonePublicly));
          setIsProfilePublic(u.isProfilePublic !== false);
          setAvatarVisible(u.avatarVisible !== false);
        }
      } catch (err) {
        setError('Failed to load profile details');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full Name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);
      startGlobalProgress();

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          displayName: displayName.trim() || null,
          designation: designation.trim() || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
          image: image || null,
          showEmailPublicly,
          showPhonePublicly,
          isProfilePublic,
          avatarVisible,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to update personal information');
      }

      setSaveSuccess(true);
      await refreshAuth();
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setSaving(false);
      completeGlobalProgress();
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading personal profile settings...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <IdCard className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Personal Information & Identity
            </h2>
            <p className="text-xs text-slate-400">
              Manage your personal credentials, organizational title, and member directory privacy
            </p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Personal information and directory privacy settings updated successfully.</span>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Profile Image */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Profile Avatar & Photo
          </label>
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-slate-800 border border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
              {image ? (
                <img src={image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-slate-500" />
              )}
            </div>
            <div className="flex-1 max-w-sm">
              <ImageUpload
                value={image}
                onChange={(url) => setImage(url)}
                label="Upload photo"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                PNG, JPG or WEBP under 2MB. Displayed across your member workspaces.
              </p>
            </div>
          </div>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Full Name <span className="text-red-400">*</span></span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alice Chen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <IdCard className="w-3.5 h-3.5 text-slate-400" />
              <span>Public Display Name (Optional)</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Preferred name for member directories"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Designation & Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-slate-400" />
              <span>Professional Designation / Title</span>
            </label>
            <input
              type="text"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Secretary General, Head of Department"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>Contact Phone</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Email (Read-Only) */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>Account Email Address</span>
          </label>
          <input
            type="email"
            disabled
            value={email}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 text-xs text-slate-400 cursor-not-allowed select-all"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            Authentication email is managed securely via your sign-in provider.
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Bio & Civic Statement</span>
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share a brief statement about your civic involvement or leadership background..."
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Member Directory Privacy Settings */}
        <div className="pt-6 border-t border-slate-800/80 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Directory Privacy & Visibility Controls
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Show Email on Member Directory
                </span>
                <span className="text-[11px] text-slate-400">
                  Allow fellow organization members to see your email address in the directory.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showEmailPublicly}
                onChange={(e) => setShowEmailPublicly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Show Phone on Member Directory
                </span>
                <span className="text-[11px] text-slate-400">
                  Allow organization administrators and members to see your phone number.
                </span>
              </div>
              <input
                type="checkbox"
                checked={showPhonePublicly}
                onChange={(e) => setShowPhonePublicly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Public Profile Visibility
                </span>
                <span className="text-[11px] text-slate-400">
                  Allow leadership card and public organization credits to show your profile.
                </span>
              </div>
              <input
                type="checkbox"
                checked={isProfilePublic}
                onChange={(e) => setIsProfilePublic(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Personal Information</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

