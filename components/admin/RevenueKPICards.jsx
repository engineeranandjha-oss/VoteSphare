'use client';

import {
  TrendingUp,
  CreditCard,
  Users,
  Calendar,
} from 'lucide-react';

export default function RevenueKPICards({ kpis = {} }) {
  const {
    totalGrossRevenueFormatted = '₹0',
    netRevenueFormatted = '₹0',
    totalRefundedFormatted = '₹0',
    mrrFormatted = '₹0',
    arrFormatted = '₹0',
    recent30DaysFormatted = '₹0',
    recent30DaysCount = 0,
    activeSubscriptionsCount = 0,
    pendingGracePeriodCount = 0,
    conversionRate = 0,
    totalOrganizations = 0,
    paidOrgsCount = 0,
  } = kpis;

  const cards = [
    {
      title: 'Gross Platform Revenue',
      primaryValue: totalGrossRevenueFormatted,
      subtitle: `Net Revenue: ${netRevenueFormatted}`,
      badge: totalRefundedFormatted !== '₹0' ? `Refunds: ${totalRefundedFormatted}` : 'All-time',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: TrendingUp,
      iconColor: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'Monthly Recurring Revenue (MRR)',
      primaryValue: mrrFormatted,
      subtitle: `Annual Run Rate: ${arrFormatted}`,
      badge: `${activeSubscriptionsCount} active subscriptions`,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: CreditCard,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      title: 'Past 30 Days Revenue',
      primaryValue: recent30DaysFormatted,
      subtitle: `${recent30DaysCount} successful transactions`,
      badge: 'Last 30 Days',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      icon: Calendar,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      title: 'Customer Conversion Rate',
      primaryValue: `${conversionRate}%`,
      subtitle: `${paidOrgsCount} of ${totalOrganizations} workspaces paid`,
      badge: pendingGracePeriodCount > 0 ? `${pendingGracePeriodCount} in grace period` : 'Healthy billing',
      badgeColor:
        pendingGracePeriodCount > 0
          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Users,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className={`p-2.5 rounded-2xl border ${card.iconBg} ${card.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${card.badgeColor}`}>
                  {card.badge}
                </span>
              </div>
              <p className="text-xs font-medium text-slate-400">{card.title}</p>
              <h3 className="text-2xl font-black text-white tracking-tight mt-1">
                {card.primaryValue}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}

