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

      <div
        className={`relative flex flex-col sm:flex-row rounded-xl shadow-sm border bg-slate-900 overflow-hidden transition-all ${
          error
            ? 'border-rose-500 focus-within:ring-2 focus-within:ring-rose-500/30'
            : 'border-slate-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}
      >
        <span className="inline-flex items-center px-3.5 py-2 sm:py-2.5 bg-slate-800/90 border-b sm:border-b-0 sm:border-r border-slate-700/80 text-xs font-mono text-slate-400 select-none shrink-0">
          votesphere.com/org/
        </span>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 block w-full px-3.5 py-2.5 sm:py-2.5 bg-transparent text-sm font-mono text-white placeholder-slate-500 focus:outline-none ${
            error ? 'text-rose-300' : ''
          }`}
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-400 mt-1">{error}</p>
      ) : (
        <p className="text-xs text-slate-400 mt-1">
          Unique URL identifier for your organization portal.
        </p>
      )}
    </div>
  );
}
