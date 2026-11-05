'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Search,
} from 'lucide-react';

export default function CertificateVerificationPage() {
  const params = useParams();
  const router = useRouter();
  const certIdParam = params.certificateId;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [searchCertId, setSearchCertId] = useState('');

  useEffect(() => {
    if (!certIdParam) return;

    const fetchVerification = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/certificates/verify/${encodeURIComponent(certIdParam)}`);
        const json = await res.json();

        if (res.status === 404) {
          setData({ status: 'not_found' });
        } else if (res.ok) {
          setData(json.data);
        } else {
          setError(json.message || 'Error verifying certificate');
        }
      } catch (err) {
        setError(err.message || 'Network error verifying certificate');
      } finally {
        setLoading(false);
      }
    };

    fetchVerification();
  }, [certIdParam]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchCertId.trim()) {
      router.push(`/certificates/verify/${encodeURIComponent(searchCertId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to VoteSphere
          </Link>
          <span className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            Public Electoral Ledger
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Verifying Certificate Authenticity...
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Querying immutable VoteSphere electoral ledger for ID: {certIdParam}
            </p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center shadow-sm">
            <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Verification Request Failed
            </h2>
            <p className="text-sm text-red-600 dark:text-red-400 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Retry Verification
            </button>
          </div>
        )}

        {/* Certificate Not Found */}
        {!loading && !error && data?.status === 'not_found' && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center mx-auto mb-5 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
              Certificate Not Found
            </h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-8 text-sm">
              We could not find any official certificate registered with ID{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {certIdParam}
              </span>
              . Please verify the ID or check if it was entered correctly.
            </p>

            {/* Quick Search */}
            <form onSubmit={handleSearchSubmit} className="max-w-md mx-auto flex gap-2">
              <input
                type="text"
                placeholder="Enter Certificate Serial (e.g. VS-CERT-2026-XXXXX)"
                value={searchCertId}
                onChange={(e) => setSearchCertId(e.target.value)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                Verify
              </button>
            </form>
          </div>
        )}

        {/* Revoked Certificate */}
        {!loading && !error && data?.status === 'revoked' && (
          <div className="bg-white dark:bg-slate-900 border-2 border-red-500/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-red-500 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldX className="w-6 h-6" />
                <span className="font-bold tracking-wide uppercase text-sm">
                  Official Revocation Notice
                </span>
              </div>
              <span className="font-mono text-xs bg-red-600 px-2.5 py-1 rounded">
                STATUS: INVALID
              </span>
            </div>

            <div className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                This Certificate Has Been Revoked
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                The issuing electoral authority has officially declared this certificate null and
                void. It is no longer valid for official recognition or credentials.
              </p>

              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl p-5 mb-6 text-sm">
                <div className="font-semibold text-red-900 dark:text-red-300 mb-1">
                  Reason for Revocation:
                </div>
                <div className="text-red-800 dark:text-red-200 italic">
                  &ldquo;{data.certificate?.revocationReason || 'No reason specified'}&rdquo;
                </div>
                <div className="mt-3 text-xs text-red-700 dark:text-red-400">
                  Revoked on:{' '}
                  {data.certificate?.revokedAt
                    ? new Date(data.certificate.revokedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : 'Unknown'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <span className="text-xs uppercase tracking-wider block text-slate-400">
                    Recipient
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {data.certificate?.recipientName}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider block text-slate-400">
                    Certificate ID
                  </span>
                  <span className="font-mono font-semibold text-slate-900 dark:text-white">
                    {data.certificate?.certificateId}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider block text-slate-400">
                    Election
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {data.certificate?.electionTitle}
                  </span>
                </div>
                <div>
                  <span className="text-xs uppercase tracking-wider block text-slate-400">
                    Issuing Organization
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {data.certificate?.organizationName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Valid / Authentic Certificate */}
        {!loading && !error && data?.status === 'valid' && (
          <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-amber-500/40 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header Verification Strip */}
            <div className="bg-[#0c2340] text-white px-6 py-3.5 flex items-center justify-between border-b-2 border-amber-600">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span className="font-bold tracking-wider uppercase text-xs sm:text-sm text-slate-100">
                  Verified Electoral Credential • VoteSphere Ledger
                </span>
              </div>
              <span className="font-mono text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-semibold tracking-wider">
                AUTHENTIC &bull; ACTIVE
              </span>
            </div>

            <div className="p-6 sm:p-10 relative bg-gradient-to-b from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
              {/* Top Organization Branding (NO VoteSphere logo at top) */}
              <div className="text-center mb-6">
                <div className="flex justify-center mb-3">
                  {data.certificate.organization?.logo ? (
                    <div className="w-16 h-16 rounded-full border-2 border-amber-600 p-0.5 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      <img
                        src={data.certificate.organization.logo}
                        alt={data.certificate.organizationName}
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full border-2 border-amber-600 bg-[#0c2340] text-amber-400 font-serif font-bold text-lg flex items-center justify-center shadow-sm">
                      {data.certificate.organizationName
                        ? data.certificate.organizationName
                            .split(' ')
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()
                        : 'VS'}
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-extrabold tracking-widest uppercase text-[#0c2340] dark:text-slate-100">
                  {data.certificate.organizationName}
                </h3>
                <p className="text-[10px] tracking-wider uppercase font-semibold text-amber-700 dark:text-amber-400 mt-0.5">
                  Official Democratic Election Authority • Certified Electoral Record
                </p>
                <div className="w-24 h-0.5 bg-amber-600/60 mx-auto mt-2" />
              </div>

              {/* Title Banner - Ornamental Plaque */}
              <div className="relative max-w-xl mx-auto my-3">
                <div className="bg-[#0c2340] border-2 border-amber-600/90 rounded-md py-3.5 px-8 text-center shadow-lg relative overflow-hidden">
                  <div className="absolute inset-x-2 inset-y-1 border border-amber-400/40 pointer-events-none rounded-sm" />
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-white tracking-wider uppercase">
                    {data.certificate.certificateType === 'victory'
                      ? 'Certificate of Election Victory'
                      : 'Certificate of Participation'}
                  </h2>
                </div>
              </div>

              <p className="text-center text-[11px] font-bold tracking-widest uppercase text-amber-800 dark:text-amber-400 mb-6 mt-4">
                This Official Credential is Proudly Conferred Upon
              </p>

              {/* Recipient Name with Laurel Branches */}
              <div className="text-center mb-6 relative">
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  {/* Left Laurel Branch */}
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 rotate-12 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.5 3C8 4.5 7.5 6 6 7.5c-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C5 3 6.5 2.5 7.5 3zm5 2c.5 1.5 0 3-1.5 4.5-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C10 5 11.5 4.5 12.5 5zm4 4c.5 1.5 0 3-1.5 4.5-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C14 9 15.5 8.5 16.5 9zm2.5 5c.5 1.5 0 3-1.5 4.5-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C16.5 14 18 13.5 19 14zM2 21c4-2 8-5 11-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <circle cx="5" cy="5" r="1.5" />
                    <circle cx="10" cy="7" r="1.5" />
                    <circle cx="14" cy="11" r="1.5" />
                    <circle cx="17" cy="16" r="1.5" />
                  </svg>

                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">
                    {data.certificate.recipientName}
                  </h1>

                  {/* Right Laurel Branch */}
                  <svg
                    className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600 -rotate-12 scale-x-[-1] flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.5 3C8 4.5 7.5 6 6 7.5c-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C5 3 6.5 2.5 7.5 3zm5 2c.5 1.5 0 3-1.5 4.5-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C10 5 11.5 4.5 12.5 5zm4 4c.5 1.5 0 3-1.5 4.5-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C14 9 15.5 8.5 16.5 9zm2.5 5c.5 1.5 0 3-1.5 4.5-1 1-2.5 1-3.5 0-.5-1 0-2.5 1.5-3.5C16.5 14 18 13.5 19 14zM2 21c4-2 8-5 11-10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                    <circle cx="5" cy="5" r="1.5" />
                    <circle cx="10" cy="7" r="1.5" />
                    <circle cx="14" cy="11" r="1.5" />
                    <circle cx="17" cy="16" r="1.5" />
                  </svg>
                </div>

                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="w-20 h-0.5 bg-amber-600" />
                  <div className="w-2 h-2 rotate-45 bg-amber-600" />
                  <div className="w-20 h-0.5 bg-amber-600" />
                </div>
              </div>

              {/* Electoral Citation & Position */}
              <div className="text-center mb-6 max-w-lg mx-auto">
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {data.certificate.certificateType === 'victory'
                    ? 'for securing the certified democratic mandate and being officially elected to the office of'
                    : 'for successfully participating as a candidate in the democratic electoral process for the office of'}
                </p>
                <div className="text-lg sm:text-xl font-serif font-bold text-[#0c2340] dark:text-blue-300 mt-1.5">
                  {data.certificate.positionTitle}
                </div>
                <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">
                  in the {data.certificate.electionTitle}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  conducted by {data.certificate.organizationName} under constitutional democratic electoral bylaws.
                </p>
              </div>

              {/* Certified Tally Mandate Strip - Elongated Capsule */}
              <div className={`rounded-full px-6 py-3 mb-8 max-w-xl mx-auto border text-center shadow-inner ${
                data.certificate.certificateType === 'victory'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-400/80 text-amber-900 dark:text-amber-200'
                  : 'bg-blue-50 dark:bg-blue-950/30 border-blue-400/80 text-blue-900 dark:text-blue-200'
              }`}>
                <div className="text-xs font-bold uppercase tracking-wider">
                  {data.certificate.certificateType === 'victory'
                    ? `Certified Mandate: ${data.certificate.votesReceived?.toLocaleString() || 0} votes ${
                        data.certificate.votePercentage ? `(${data.certificate.votePercentage}%)` : ''
                      } of ${data.certificate.totalVotes?.toLocaleString() || 0} ballots cast`
                    : `Candidate Participation: ${data.certificate.votesReceived?.toLocaleString() || 0} votes recorded`}
                </div>
                <div className="text-[11px] opacity-80 mt-0.5">
                  {data.certificate.certificateType === 'victory' ? 'Certified Election Victory' : 'Official Candidate Recognition'} • Declared on{' '}
                  {data.certificate.issuedAt
                    ? new Date(data.certificate.issuedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : 'Official Record'}{' '}
                  • Result Version: 1
                </div>
              </div>

              {/* Bottom Tripartite Section: Verification / Seal / Digital Authorization */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center border-t border-slate-200 dark:border-slate-800 pt-6 mb-6">
                {/* Left: Verification & Cryptographic Ledger */}
                <div className="text-left text-xs text-slate-600 dark:text-slate-400 md:pr-4 md:border-r md:border-amber-600/30">
                  <div className="font-bold text-[#0c2340] dark:text-slate-200 uppercase tracking-wider text-[11px] mb-1">
                    Tamper-Evident Ledger
                  </div>
                  <div className="font-mono text-[11px]">
                    Serial: <span className="font-bold text-slate-900 dark:text-white">{data.certificate.certificateId}</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    Token: {data.certificate.verificationTokenPrefix || 'Verified'}...
                  </div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1">
                    votesphere.org/verify
                  </div>
                </div>

                {/* Center: Official VoteSphere Seal */}
                <div className="text-center px-2">
                  <img
                    src="/Votesphere Official Seal.png"
                    alt="Official VoteSphere Seal"
                    className="w-20 h-20 object-contain mx-auto drop-shadow-md"
                  />
                  <div className="text-[10px] font-bold text-[#0c2340] dark:text-slate-200 uppercase tracking-wider mt-1.5">
                    VoteSphere Electoral Commission
                  </div>
                  <div className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 tracking-wider uppercase">
                    Official Seal of Democratic Integrity
                  </div>
                </div>

                {/* Right: Digital Authorization Attribution (NO demo signature) */}
                <div className="text-center md:text-right text-xs md:pl-4 md:border-l md:border-amber-600/30">
                  <div className="font-bold text-[#0c2340] dark:text-slate-200 text-xs sm:text-[13px]">
                    Digitally signed by &ldquo;{data.certificate.organization?.ownerName || 'Authorized Election Official'}&rdquo;
                  </div>
                  <div className="w-40 h-px bg-slate-400 dark:bg-slate-600 mx-auto md:ml-auto md:mr-0 my-1.5" />
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Authorized Election Official
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Electoral Commission Representative
                  </div>
                  <div className="text-[10px] italic text-slate-400 dark:text-slate-500">
                    {data.certificate.organizationName}
                  </div>
                </div>
              </div>

              {/* Bottom Information Ribbon - Left-Aligned Pill */}
              <div className="bg-[#0c2340] text-amber-400 rounded-full py-2.5 px-6 text-left text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase mb-6 flex flex-wrap items-center gap-2 border border-amber-600/40 shadow-sm">
                <span>CERTIFICATE SERIAL: {data.certificate.certificateId}</span>
                <span className="text-amber-500">★</span>
                <span className="text-white">ZERO-KNOWLEDGE ANONYMITY PROTECTED</span>
                <span className="text-amber-500">★</span>
                <span>RESULT VERSION: 1</span>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <a
                  href={`/api/certificates/${data.certificate.certificateId}/pdf?download=true&t=${Date.now()}`}
                  target="_blank"
                  rel="noreferrer"
                  download={`Certificate-${data.certificate.certificateId}.pdf`}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Download Official PDF
                </a>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {copiedLink ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        Copied Link!
                      </>
                    ) : (
                      <>
                        <Share2 className="w-4 h-4" />
                        Share Verification Link
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

