'use client';

import { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Eye,
  Edit3,
  CheckCircle2,
  Users,
  Loader2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export default function EmailInviteModal({ election, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('compose'); // 'compose' | 'preview'
  const [notifyAllEligible, setNotifyAllEligible] = useState(true);
  const [rawEmails, setRawEmails] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successResult, setSuccessResult] = useState(null);

  if (!isOpen || !election) return null;

  const electionId = election.id;
  const electionTitle = election.title || 'Election';
  const orgName = election.organization?.name || 'Organization';

  const parsedCustomEmails = rawEmails
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e.length > 0 && e.includes('@'));

  async function handleSendInvitations() {
    try {
      setSubmitting(true);
      setError(null);
      setSuccessResult(null);

      if (!notifyAllEligible && parsedCustomEmails.length === 0) {
        throw new Error('Please select all eligible voters or enter at least one valid email address.');
      }

      const res = await fetch(`/api/elections/${electionId}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notifyAllEligible,
          emails: parsedCustomEmails,
          customMessage,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Failed to send invitations');
      }

      setSuccessResult(json.data);
    } catch (err) {
      setError(err.message || 'An error occurred while dispatching emails.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto space-y-6 text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer z-10"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Voter Communications
            </span>
            <h2 className="text-xl font-black text-white tracking-tight leading-tight">
              Dispatch Ballot Email Invitations
            </h2>
          </div>
        </div>

        {/* Success Banner */}
        {successResult && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Invitations Dispatched Successfully!</span>
            </div>
            <p className="text-emerald-200/90">
              Sent {successResult.sent} of {successResult.total} emails.{' '}
              {successResult.failed > 0 && `(${successResult.failed} failed/skipped)`}
            </p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('compose')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'compose'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Compose & Recipients</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Email Preview</span>
          </button>
        </div>

        {/* TAB 1: Compose Form */}
        {activeTab === 'compose' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            {/* Target Options */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Target Recipients
              </label>

              <label className="flex items-center gap-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:border-slate-700 transition-colors">
                <input
                  type="checkbox"
                  checked={notifyAllEligible}
                  onChange={(e) => setNotifyAllEligible(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700 focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-blue-400" />
                    <span>Send to all registered eligible voters</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Automatically includes all active electors enrolled on this election roster.
                  </div>
                </div>
              </label>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Additional Email Addresses (Optional, comma or newline-separated)
                </label>
                <textarea
                  rows={3}
                  value={rawEmails}
                  onChange={(e) => setRawEmails(e.target.value)}
                  placeholder="voter1@university.edu&#10;voter2@organization.org"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
                />
                {parsedCustomEmails.length > 0 && (
                  <span className="text-[11px] text-blue-400 font-semibold mt-1 block">
                    {parsedCustomEmails.length} additional email recipient(s) recognized
                  </span>
                )}
              </div>
            </div>

            {/* Custom Message Note */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Custom Announcement Note (Optional)
              </label>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="e.g. Please take 2 minutes to review candidate manifestos and cast your ballot before Friday 5 PM."
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* TAB 2: Live HTML Email Preview */}
        {activeTab === 'preview' && (
          <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-4 text-center animate-in fade-in duration-150">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              Official Ballot Invitation
            </span>
            <h3 className="text-xl font-black text-white">{electionTitle}</h3>
            <p className="text-xs text-slate-400">
              Organized by <strong className="text-slate-200">{orgName}</strong>
            </p>

            {customMessage && (
              <div className="p-3 rounded-xl bg-slate-900 border-l-4 border-blue-500 text-xs text-slate-300 italic text-left max-w-md mx-auto">
                &ldquo;{customMessage}&rdquo;
              </div>
            )}

            <div className="py-2">
              <button
                type="button"
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-500/25 pointer-events-none"
              >
                Enter Voting Booth 🗳️
              </button>
            </div>

            <div className="text-[11px] text-emerald-400 flex items-center justify-center gap-1 font-medium">
              <Lock className="h-3.5 w-3.5" />
              <span>100% Cryptographically Anonymous Voting</span>
            </div>
          </div>
        )}

        {/* Modal Action Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSendInvitations}
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Dispatching Invitations...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Send Email Invitations</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
