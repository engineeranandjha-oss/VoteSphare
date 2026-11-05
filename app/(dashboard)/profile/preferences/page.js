'use client';

import { useState, useEffect } from 'react';
import {
  Sliders,
  Bell,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Notification Preferences
  const [notifications, setNotifications] = useState({
    emailInvites: true,
    turnoutUpdates: false,
    resultsPublished: true,
    billingUpdates: true,
  });

  // Theme Preference
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const json = await res.json();
          const prefs = json.data?.user?.notificationPreferences;
          if (prefs) {
            setNotifications({
              emailInvites: prefs.emailInvites !== false,
              turnoutUpdates: Boolean(prefs.turnoutUpdates),
              resultsPublished: prefs.resultsPublished !== false,
              billingUpdates: prefs.billingUpdates !== false,
            });
          }
        }
      } catch (err) {
        setError('Error loading preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSavePreferences = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);
      setSaveSuccess(false);

      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationPreferences: notifications,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to save preferences');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Error updating preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading your preferences...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Workspace & Notification Preferences
            </h2>
            <p className="text-xs text-slate-400">
              Customize notification alerts and platform appearance
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Preferences updated and saved to your account.</span>
        </div>
      )}

      {error && (
        <div className="mx-6 mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSavePreferences} className="p-6 space-y-6">
        {/* Email Notifications */}
        <div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 text-blue-400" />
            <span>Email Notification Subscriptions</span>
          </h3>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Official Election Invitations
                </span>
                <span className="text-[11px] text-slate-400">
                  Receive email invitations containing your secure, one-time voting links.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.emailInvites}
                onChange={() => handleToggle('emailInvites')}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Turnout & Quorum Progress
                </span>
                <span className="text-[11px] text-slate-400">
                  Receive alerts as election turnout milestones and quorum thresholds are reached.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.turnoutUpdates}
                onChange={() => handleToggle('turnoutUpdates')}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Certified Results & Certificates
                </span>
                <span className="text-[11px] text-slate-400">
                  Immediate alerts when elections close, results are certified, and awards issued.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.resultsPublished}
                onChange={() => handleToggle('resultsPublished')}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
              <div>
                <span className="text-xs font-semibold text-white block">
                  Billing, Receipts & Plan Renewals
                </span>
                <span className="text-[11px] text-slate-400">
                  Receive tax invoice receipts and subscription renewal notifications.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.billingUpdates}
                onChange={() => handleToggle('billingUpdates')}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="pt-4 border-t border-slate-800/80">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Moon className="w-3.5 h-3.5 text-purple-400" />
            <span>Appearance Theme</span>
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border text-center transition-all ${
                theme === 'dark'
                  ? 'bg-blue-600/10 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Moon className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <span className="text-xs">Dark Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border text-center transition-all ${
                theme === 'light'
                  ? 'bg-blue-600/10 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-4 h-4 mx-auto mb-1 text-amber-400" />
              <span className="text-xs">Light Mode</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border text-center transition-all ${
                theme === 'system'
                  ? 'bg-blue-600/10 border-blue-500 text-white font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4 mx-auto mb-1 text-slate-400" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

