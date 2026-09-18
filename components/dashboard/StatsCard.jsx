export default function StatsCard({
  title,
  value,
  subtitle,
  icon: IconComponent,
  trend,
  color = 'blue',
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-500/10',
      text: 'text-blue-400',
      border: 'border-blue-500/20',
      valueColor: 'text-blue-400',
    },
    emerald: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
      valueColor: 'text-emerald-400',
    },
    indigo: {
      bg: 'bg-indigo-500/10',
      text: 'text-indigo-400',
      border: 'border-indigo-500/20',
      valueColor: 'text-indigo-400',
    },
    purple: {
      bg: 'bg-purple-500/10',
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      valueColor: 'text-purple-400',
    },
    amber: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
      valueColor: 'text-amber-400',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-md transition-all hover:border-slate-700/80">
      <div className="flex items-center justify-between gap-3 mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {IconComponent && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center ${scheme.bg} ${scheme.text} border ${scheme.border}`}
          >
            <IconComponent className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-semibold text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 mt-2 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
}
