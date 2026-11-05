'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Vote,
  BarChart3,
  Award,
} from 'lucide-react';
import {
  generateWhatsAppBallotInvite,
  generateWhatsAppTurnoutUpdate,
  generateWhatsAppResultsAnnouncement,
  buildWhatsAppShareUrl,
} from '@/lib/sharing/whatsapp';
import { getDirectVotingBoothUrl, getResultsUrl, getTurnoutMonitoringUrl } from '@/lib/sharing/links';

export default function WhatsAppShareCard({
  election,
  turnout = null,
  winners = [],
}) {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' | 'turnout' | 'results'
  const [copied, setCopied] = useState(false);
  const [messages, setMessages] = useState({});

  const electionId = election?.id;

  useEffect(() => {
    if (!electionId) return;

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    const voteUrl = getDirectVotingBoothUrl(electionId, baseUrl);
    const resultsUrl = getResultsUrl(electionId, baseUrl);
    const turnoutUrl = getTurnoutMonitoringUrl(electionId, baseUrl);

    const inviteMsg = generateWhatsAppBallotInvite(election, voteUrl);
    const turnoutMsg = generateWhatsAppTurnoutUpdate(election, turnoutUrl, turnout || {});
    const resultsMsg = generateWhatsAppResultsAnnouncement(election, resultsUrl, winners);

    setMessages({
      invite: inviteMsg,
      turnout: turnoutMsg,
      results: resultsMsg,
    });
  }, [electionId, election, turnout, winners]);

  const currentMessage = messages[activeTab] || '';
  const currentWhatsAppUrl = currentMessage ? buildWhatsAppShareUrl(currentMessage) : '#';

  function handleCopy() {
    if (typeof window !== 'undefined' && currentMessage) {
      navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              WhatsApp Broadcast Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              High-converting message templates formatted specifically for WhatsApp groups & chats
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
          WhatsApp Formatted
        </span>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 bg-slate-950/80 rounded-2xl border border-slate-800/80 gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('invite')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'invite'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Vote className="h-3.5 w-3.5" />
          <span>Ballot Invitation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('turnout')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'turnout'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5" />
          <span>Turnout Update</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === 'results'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Certified Results</span>
        </button>
      </div>

      {/* Live WhatsApp Chat Bubble Preview */}
      <div className="space-y-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          Chat Message Preview
        </label>

        <div className="p-5 rounded-3xl bg-[#0b141a] border border-[#202c33] shadow-inner relative overflow-hidden">
          {/* Chat Bubble Container */}
          <div className="max-w-md ml-auto bg-[#005c4b] text-[#e9edef] p-4 rounded-2xl rounded-tr-sm shadow-md space-y-2 text-xs leading-relaxed font-sans select-all whitespace-pre-line border border-[#005c4b]/50">
            {currentMessage || 'Loading broadcast template...'}
            <div className="text-right text-[10px] text-[#8696a0] font-mono pt-1">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <a
          href={currentWhatsAppUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-3.5 px-5 rounded-2xl bg-[#25d366] hover:bg-[#20bd5a] text-[#0b141a] font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
        >
          <MessageSquare className="h-4 w-4 fill-current" />
          <span>Share to WhatsApp</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>

        <button
          type="button"
          onClick={handleCopy}
          className="py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-400" />
              <span className="text-emerald-400">Copied to Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 text-slate-300" />
              <span>Copy Message Text</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
