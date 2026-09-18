'use client';

export default function SlugInput({
  value,
  onChange,
  error,
  placeholder = 'my-organization',
  disabled = false,
}) {
  function handleInputChange(e) {
    const raw = e.target.value;
    // Slugify string: lowercase, alphanumeric and hyphens only
    const slugified = raw
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-/, '');
    onChange(slugified);
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Workspace URL Slug <span className="text-rose-400">*</span>
      </label>

      <div className="relative flex rounded-xl shadow-sm">
        <span className="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-slate-700 bg-slate-800 text-xs font-mono text-slate-400 select-none">
          votesphere.com/org/
        </span>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 block w-full px-3.5 py-2.5 rounded-none rounded-r-xl bg-slate-900 border text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
            error
              ? 'border-rose-500 focus:ring-rose-500/30'
              : 'border-slate-700 focus:border-blue-500 focus:ring-blue-500/20'
          }`}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-400 mt-1">{error}</p>
      ) : (
        <p className="text-xs text-slate-500 mt-1">
          Unique URL identifier for your organization portal.
        </p>
      )}
    </div>
  );
}
