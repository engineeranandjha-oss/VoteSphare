'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Award,
  Download,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertOctagon,
  CheckCircle2,
  X,
} from 'lucide-react';

export default function ElectionCertificatesCard({ electionId, status }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Revocation modal state
  const [revokingCert, setRevokingCert] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [submittingRevoke, setSubmittingRevoke] = useState(false);

  const isPublished = status === 'published';

  const fetchCertificates = useCallback(async () => {
    try {
      setLoading(true);
      setActionError(null);
      const res = await fetch(`/api/elections/${electionId}/certificates`);
      if (res.ok) {
        const json = await res.json();
        setCertificates(json.data?.certificates || []);
      }
    } catch (err) {
      // Graceful error handling
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setActionError(null);
      setActionSuccess(null);

      const res = await fetch(`/api/elections/${electionId}/certificates/generate`, {
        method: 'POST',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to generate certificates');
      }

      setActionSuccess(
        `Certificates successfully processed! ${json.data?.newlyGenerated || 0} newly generated, ${
          json.data?.existing || 0
        } already registered.`
      );
      fetchCertificates();
    } catch (err) {
      setActionError(err.message || 'Error generating certificates');
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenRevoke = (cert) => {
    setRevokingCert(cert);
    setRevokeReason('');
    setActionError(null);
  };

  const handleConfirmRevoke = async (e) => {
    e.preventDefault();
    if (!revokeReason.trim() || !revokingCert) return;

    try {
      setSubmittingRevoke(true);
      setActionError(null);

      const res = await fetch(`/api/certificates/${revokingCert.certificateId}/revoke`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: revokeReason.trim() }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || 'Failed to revoke certificate');
      }

      setActionSuccess(`Certificate ${revokingCert.certificateId} has been officially revoked.`);
      setRevokingCert(null);
      fetchCertificates();
    } catch (err) {
      setActionError(err.message || 'Error revoking certificate');
    } finally {
      setSubmittingRevoke(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Electoral Certificates & Verification
            </h3>
            <p className="text-xs text-slate-400">
              Cryptographically verified Winner & Civic Participation digital credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isPublished && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Issuing Certificates...</span>
                </>
              ) : (
                <>
                  <Award className="w-3.5 h-3.5" />
                  <span>{certificates.length > 0 ? 'Sync / Re-issue' : 'Generate Certificates'}</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={fetchCertificates}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh certificate list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Banners */}
      {actionSuccess && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertOctagon className="w-4 h-4 shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Body Content */}
      <div className="p-6">
        {!isPublished && (
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/50 text-center">
            <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">
              Certificates Locked Until Results Are Published
            </h4>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              To guarantee constitutional integrity, official Election Victory and Civic
              Participation certificates can only be generated after the election results are
              certified and published.
            </p>
          </div>
        )}

        {isPublished && loading && certificates.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto mb-2" />
            Loading registered certificates...
          </div>
        )}

        {isPublished && !loading && certificates.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">
            <Award className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-300 mb-1">No Certificates Generated Yet</p>
            <p className="text-slate-400 mb-4">
              Click &quot;Generate Certificates&quot; to issue official credentials for winners and active candidates.
            </p>
          </div>
        )}

        {certificates.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/60 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Serial & Type</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Office</th>
                  <th className="px-4 py-3">Mandate</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {certificates.map((cert) => {
                  const isVictory = cert.certificateType === 'victory';
                  const isRevoked = Boolean(cert.revokedAt);

                  return (
                    <tr key={cert.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-mono font-semibold text-slate-200">
                          {cert.certificateId}
                        </div>
                        <span
                          className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isVictory
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {isVictory ? 'Victory' : 'Participation'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-white">
                        {cert.recipientNameSnapshot}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {cert.positionTitleSnapshot || cert.position?.name || 'Position'}
                      </td>

                      <td className="px-4 py-3 text-slate-300">
                        {typeof cert.votesReceived === 'number' ? (
                          <span>
                            {cert.votesReceived.toLocaleString()} votes{' '}
                            {cert.votePercentage ? `(${cert.votePercentage}%)` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {isRevoked ? (
                          <span className="inline-flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Revoked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Valid
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`/api/certificates/${cert.certificateId}/pdf?download=true&t=${Date.now()}`}
                            target="_blank"
                            rel="noreferrer"
                            download={`Certificate-${cert.certificateId}.pdf`}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white transition-colors inline-flex items-center gap-1 font-semibold text-[11px]"
                            title="Download PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>PDF</span>
                          </a>

                          <Link
                            href={`/certificates/verify/${cert.certificateId}`}
                            target="_blank"
                            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                            title="Verify on ledger"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {!isRevoked && (
                            <button
                              onClick={() => handleOpenRevoke(cert)}
                              className="px-2 py-1 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors font-medium text-[11px]"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revocation Confirmation Modal */}
      {revokingCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-red-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
                <AlertOctagon className="w-5 h-5" />
                <span>Confirm Certificate Revocation</span>
              </div>
              <button
                onClick={() => setRevokingCert(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              You are revoking certificate{' '}
              <strong className="text-white font-mono">{revokingCert.certificateId}</strong> issued to{' '}
              <strong className="text-white">{revokingCert.recipientNameSnapshot}</strong>. This
              action is permanent and will be publicly registered in the audit registry.
            </p>

            <form onSubmit={handleConfirmRevoke} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Revocation <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Administrative error, disqualification, or inaccurate candidate tally recorded..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingCert(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-750 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRevoke || !revokeReason.trim()}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submittingRevoke && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Revocation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

