'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  QrCode,
  Link2,
  Mail,
  Send,
  MessageSquare,
} from 'lucide-react';
import VotingLinkCard from './VotingLinkCard';
import QRCodeCard from './QRCodeCard';
import { generateSocialShareLinks } from '@/lib/sharing/social';
import { getPublicElectionUrl } from '@/lib/sharing/links';

export default function ShareModal({
  election,
  isOpen,
  onClose,
  defaultTab = 'channels',
}) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [copied, setCopied] = useState(false);
  const [socialLinks, setSocialLinks] = useState(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const electionId = election?.id;
  const electionTitle = election?.title || 'Election';
  const orgSlug = election?.organization?.slug;
  const orgName = election?.organization?.name;

  useEffect(() => {
    if (!electionId) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const targetUrl = getPublicElectionUrl(electionId, baseUrl);
    const generated = generateSocialShareLinks(election, targetUrl);
    setSocialLinks(generated);

    if (typeof navigator !== 'undefined' && navigator.share) {
      setCanNativeShare(true);
    }
  }, [electionId, election]);

  if (!isOpen || !election) return null;

  function handleCopyTargetUrl() {
    if (typeof window !== 'undefined' && socialLinks?.targetUrl) {
      navigator.clipboard.writeText(socialLinks.targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share && socialLinks) {
      try {
        await navigator.share({
          title: electionTitle,
          text: socialLinks.shareText,
          url: socialLinks.targetUrl,
        });
      } catch {
        // User dismissed share dialog
      }
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
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
              Share Election Ballot
            </span>
            <h2 className="text-xl font-black text-white tracking-tight leading-tight">
              {electionTitle}
            </h2>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('channels')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'channels'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Social & Apps</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('links')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'links'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link2 className="h-3.5 w-3.5" />
            <span>Links & Embed</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'qr'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* TAB 1: Social & Messaging Channels */}
        {activeTab === 'channels' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* 1-Click Copy Banner */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Globe className="h-4 w-4 text-blue-400 shrink-0" />
                <span className="text-xs font-mono text-slate-300 truncate">
                  {socialLinks?.targetUrl || 'Loading URL...'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopyTargetUrl}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            {/* Native OS Share Button (Mobile & Supported Browsers) */}
            {canNativeShare && (
              <button
                type="button"
                onClick={handleNativeShare}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                <span>Share via System Dialog (AirDrop, Messages, etc.)</span>
              </button>
            )}

            {/* Social Channels Grid */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Direct Social & Messaging Apps
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* WhatsApp */}
                <a
                  href={socialLinks?.whatsapp || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/40 text-emerald-300 transition-all flex items-center gap-3 shadow-md"
                >
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">WhatsApp</div>
                    <div className="text-[11px] text-emerald-400/80">Share with contacts & groups</div>
                  </div>
                </a>

                {/* X / Twitter */}
                <a
                  href={socialLinks?.twitter || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-all flex items-center gap-3 shadow-md"
                >
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-white font-black text-sm shrink-0">
                    𝕏
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">X (Twitter)</div>
                    <div className="text-[11px] text-slate-400">Post announcement to followers</div>
                  </div>
                </a>

                {/* Telegram */}
                <a
                  href={socialLinks?.telegram || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 hover:bg-sky-900/40 text-sky-300 transition-all flex items-center gap-3 shadow-md"
                >
                  <div className="w-9 h-9 rounded-xl bg-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                    <Send className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Telegram</div>
                    <div className="text-[11px] text-sky-400/80">Broadcast to channels & chats</div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={socialLinks?.email || '#'}
                  className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 hover:bg-indigo-900/40 text-indigo-300 transition-all flex items-center gap-3 shadow-md"
                >
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Email</div>
                    <div className="text-[11px] text-indigo-400/80">Send pre-filled voter invitation</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Links & Embed */}
        {activeTab === 'links' && (
          <div className="animate-in fade-in duration-150">
            <VotingLinkCard
              electionId={electionId}
              electionTitle={electionTitle}
              orgSlug={orgSlug}
            />
          </div>
        )}

        {/* TAB 3: QR Code */}
        {activeTab === 'qr' && (
          <div className="animate-in fade-in duration-150">
            <QRCodeCard
              electionId={electionId}
              electionTitle={electionTitle}
              orgName={orgName}
            />
          </div>
        )}
      </div>
    </div>
  );
}
