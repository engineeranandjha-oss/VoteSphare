'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Award,
  Download,
  ExternalLink,
  Loader2,
  Calendar,
  Building2,
  Vote,
} from 'lucide-react';

export default function UserCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCerts = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/user/certificates');
        if (res.ok) {
          const json = await res.json();
          setCertificates(json.data?.certificates || []);
        }
      } catch (err) {
        // Handle error
      } finally {
        setLoading(false);
      }
    };

    fetchCerts();
  }, []);

  const filteredCerts = certificates.filter((c) => {
    if (filter === 'victory') return c.certificateType === 'victory';
    if (filter === 'participation') return c.certificateType === 'participation';
    return true;
  });

  if (loading) {
    return (
      <div className="p-12 text-center rounded-3xl bg-slate-900/80 border border-slate-800">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
        <p className="text-xs text-slate-400">Loading your electoral credentials...</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Certificates & Electoral Awards
            </h2>
            <p className="text-xs text-slate-400">
              Official credentials earned through election candidacy and democratic victory
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({certificates.length})
          </button>
          <button
            onClick={() => setFilter('victory')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'victory'
                ? 'bg-amber-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Victory
          </button>
          <button
            onClick={() => setFilter('participation')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filter === 'participation'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Participation
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {filteredCerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-3">
            <Award className="w-12 h-12 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">No Certificates Found</h3>
            <p className="text-slate-400 max-w-sm mx-auto">
              Certificates are automatically issued when election administrators certify and
              publish election results for positions in which you participated or won.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCerts.map((cert) => {
              const isVictory = cert.certificateType === 'victory';
              const isRevoked = Boolean(cert.revokedAt);

              return (
                <div
                  key={cert.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isVictory
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isVictory ? 'Victory Certificate' : 'Participation Award'}
                      </span>

                      <div className="flex items-center gap-2">
                        {isRevoked && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-500/30">
                            Revoked
                          </span>
                        )}
                        <span className="font-mono text-xs text-slate-400">
                          {cert.certificateId}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-white tracking-tight">
                        {cert.positionTitleSnapshot || cert.position?.name || 'Position'}
                      </h4>
                      <p className="text-xs text-blue-400 font-medium">
                        {cert.electionTitleSnapshot || cert.election?.title || 'Election'}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">
                          {cert.orgNameSnapshot || cert.organization?.name || 'Organization'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>
                          {cert.issuedAt
                            ? new Date(cert.issuedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Official'}
                        </span>
                      </div>

                      {typeof cert.votesReceived === 'number' && (
                        <div className="flex items-center gap-2">
                          <Vote className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>
                            {cert.votesReceived.toLocaleString()} votes{' '}
                            {cert.votePercentage ? `(${cert.votePercentage}%)` : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/certificates/verify/${cert.certificateId}`}
                      target="_blank"
                      className="text-xs text-slate-400 hover:text-white transition-colors inline-flex items-center gap-1 font-semibold"
                    >
                      <span>Verify Authenticity</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <a
                      href={`/api/certificates/${cert.certificateId}/pdf?download=true&t=${Date.now()}`}
                      target="_blank"
                      rel="noreferrer"
                      download={`Certificate-${cert.certificateId}.pdf`}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

