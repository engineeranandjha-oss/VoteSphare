'use client';

import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';

export default function PlanComparisonTable() {
  const features = [
    {
      category: 'Electoral Capacity & Scalability',
      rows: [
        {
          name: 'Monthly Elections Allowance',
          free: '2 / month',
          eventPass: '1 election (+1 runoff)',
          starter: '5 / month',
          pro: '20 / month',
          enterprise: 'Unlimited',
        },
        {
          name: 'Eligible Voters per Election',
          free: 'Up to 50',
          eventPass: 'Up to 500',
          starter: 'Up to 250',
          pro: 'Up to 1,500',
          enterprise: 'Unlimited / Custom',
        },
        {
          name: 'Simultaneous Live Elections',
          free: '1 active',
          eventPass: '1 active',
          starter: '2 active',
          pro: '5 active',
          enterprise: 'Custom Scale',
        },
        {
          name: 'Voter Capacity Booster Add-ons',
          free: false,
          eventPass: true,
          starter: true,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Governance & Advanced Rules',
      rows: [
        {
          name: 'Automated Runoff Election Engine',
          free: false,
          eventPass: true,
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'White-Label Branding & Watermark Removal',
          free: false,
          eventPass: true,
          starter: false,
          pro: true,
          enterprise: true,
        },
        {
          name: 'CSV Voter Roster Bulk Import',
          free: true,
          eventPass: true,
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Cryptographic PDF Ballot Receipts',
          free: true,
          eventPass: true,
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Full Audit Trail Log Export',
          free: false,
          eventPass: true,
          starter: false,
          pro: true,
          enterprise: true,
        },
      ],
    },
    {
      category: 'Compliance, Tax & Support',
      rows: [
        {
          name: 'Zero-Knowledge Ballot Dissociation',
          free: true,
          eventPass: true,
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Official GST Tax Invoices (SAC 998313)',
          free: false,
          eventPass: true,
          starter: true,
          pro: true,
          enterprise: true,
        },
        {
          name: 'Customer Support Level',
          free: 'Community',
          eventPass: 'Standard Email',
          starter: 'Email Support',
          pro: 'Priority Email',
          enterprise: 'Dedicated Account SLA',
        },
      ],
    },
  ];

  const renderCell = (val) => {
    if (typeof val === 'boolean') {
      return val ? (
        <Check className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mx-auto" />
      ) : (
        <X className="w-4 h-4 text-slate-300 dark:text-slate-600 mx-auto" />
      );
    }
    return <span className="font-semibold text-slate-800 dark:text-slate-200">{val}</span>;
  };

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl dark:shadow-2xl backdrop-blur-xl overflow-hidden transition-colors">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Compare Plan Features
        </h3>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2">
          Transparent feature comparison tailored for schools, universities, RWAs, and enterprises.
        </p>
      </div>

      <div className="overflow-x-auto -mx-6 sm:mx-0 px-6 sm:px-0">
        <table className="w-full min-w-[640px] text-xs text-center border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
              <th className="text-left py-4 px-4 font-bold text-slate-900 dark:text-white w-1/3">
                Capabilities
              </th>
              <th className="py-4 px-3 font-bold text-slate-800 dark:text-slate-200">Free</th>
              <th className="py-4 px-3 font-bold text-amber-600 dark:text-amber-300">Event Pass</th>
              <th className="py-4 px-3 font-bold text-slate-800 dark:text-slate-200">Starter</th>
              <th className="py-4 px-3 font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded-t-xl">
                Professional
              </th>
              <th className="py-4 px-3 font-bold text-slate-800 dark:text-slate-200">Enterprise</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {features.map((section, idx) => (
              <React.Fragment key={`cat-frag-${idx}`}>
                <tr className="bg-slate-50 dark:bg-slate-950/60">
                  <td
                    colSpan={6}
                    className="py-3 px-4 text-left font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider text-[11px]"
                  >
                    {section.category}
                  </td>
                </tr>
                {section.rows.map((row, rIdx) => (
                  <tr
                    key={`r-${idx}-${rIdx}`}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="text-left py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                      {row.name}
                    </td>
                    <td className="py-3.5 px-3">{renderCell(row.free)}</td>
                    <td className="py-3.5 px-3">{renderCell(row.eventPass)}</td>
                    <td className="py-3.5 px-3">{renderCell(row.starter)}</td>
                    <td className="py-3.5 px-3 bg-blue-50/50 dark:bg-blue-500/5">{renderCell(row.pro)}</td>
                    <td className="py-3.5 px-3">{renderCell(row.enterprise)}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        <span>
          Constitutional Privacy Guarantee: Payments, invoices, and voter ballots are strictly isolated across all tiers.
        </span>
      </div>
    </div>
  );
}
