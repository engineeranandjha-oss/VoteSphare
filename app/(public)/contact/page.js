'use client';

import { useState, useId } from 'react';
import {
  Mail,
  Send,
  Building2,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Clock,
} from 'lucide-react';
import PublicNavbar from '@/components/navigation/PublicNavbar';
import LandingFooter from '@/components/landing/LandingFooter';

const CATEGORIES = [
  'General inquiry',
  'Organization onboarding',
  'Election support',
  'Account or login support',
  'Privacy or security report',
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: 'General inquiry',
    organization: '',
    message: '',
    consent: false,
    honeypot: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [deliveryDisabled, setDeliveryDisabled] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  // Form Field Accessibility IDs
  const nameId = useId();
  const emailId = useId();
  const subjectId = useId();
  const categoryId = useId();
  const organizationId = useId();
  const messageId = useId();
  const consentId = useId();
  const honeypotId = useId();
  const statusRegionId = useId();

  const validateClientSide = () => {
    const errors = {};

    if (!formData.name || formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name cannot exceed 100 characters.';
    }

    if (!formData.email || !formData.email.includes('@')) {
      errors.email = 'Please provide a valid email address.';
    } else if (formData.email.length > 254) {
      errors.email = 'Email address is too long.';
    }

    if (!formData.subject || formData.subject.trim().length < 5) {
      errors.subject = 'Subject must be at least 5 characters.';
    } else if (formData.subject.trim().length > 160) {
      errors.subject = 'Subject cannot exceed 160 characters.';
    }

    if (!formData.message || formData.message.trim().length < 20) {
      errors.message = 'Please provide more detail in your message (at least 20 characters).';
    } else if (formData.message.trim().length > 5000) {
      errors.message = 'Message cannot exceed 5,000 characters.';
    }

    if (!formData.consent) {
      errors.consent = 'You must consent before submitting your inquiry.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setDeliveryDisabled(false);
    setRateLimited(false);

    if (!validateClientSide()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimited(true);
          setErrorMessage(result.message || 'Too many submissions. Please wait before submitting again.');
        } else if (response.status === 503 || result.errors?.deliveryDisabled) {
          setDeliveryDisabled(true);
          setErrorMessage(
            result.message ||
              'Email delivery is currently disabled in this environment (EMAIL_DELIVERY_ENABLED=false).'
          );
        } else if (result.errors && Array.isArray(result.errors)) {
          const mapped = {};
          result.errors.forEach((err) => {
            if (err.field) mapped[err.field] = err.message;
          });
          setFieldErrors(mapped);
          setErrorMessage(result.message || 'Please fix the highlighted fields.');
        } else {
          setErrorMessage(result.message || 'Failed to transmit your message. Please try again.');
        }
        return;
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMessage(err.message || 'Network error encountered. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-400">
            <Mail className="h-3.5 w-3.5" />
            <span>Live Communication Suite</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white">Contact & Election Inquiries</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Have questions regarding cryptographic verification, organization onboarding, or ballot configuration?
            Our support and engineering team responds directly.
          </p>
        </div>

        {/* Live Status Region for Screen Readers */}
        <div id={statusRegionId} aria-live="polite" className="sr-only">
          {loading && 'Submitting contact inquiry...'}
          {submitted && 'Your message has been sent successfully.'}
          {errorMessage && `Error: ${errorMessage}`}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Direct Info Cards */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <Building2 className="h-5 w-5" />
                <span>Organization Support</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated support for educational institutions, corporate elections, societies, and voter roster onboarding.
              </p>
              <div className="text-xs font-mono text-slate-300">support@votesphere.org</div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Shield className="h-5 w-5" />
                <span>Security & Zero-Knowledge Verification</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Report responsible disclosures, request cryptographic proofs, or audit verifiable tally receipts.
              </p>
              <div className="text-xs font-mono text-slate-300">security@votesphere.org</div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Clock className="h-5 w-5" />
                <span>Response SLA</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Inquiries are routed directly to our operations team. Typical response time is within 24 business hours.
              </p>
            </div>
          </div>

          {/* Right 2 Columns: Live Form Box */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-xl">
              {submitted ? (
                /* Success State */
                <div className="text-center py-12 space-y-4 animate-in zoom-in-95">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                    <CheckCircle2 className="h-8 w-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Inquiry Dispatched</h2>
                  <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                    Your message has been sent. Our team will reply to the email address you provided:{' '}
                    <strong className="text-white font-semibold">{formData.email}</strong>.
                  </p>
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({
                          name: '',
                          email: '',
                          subject: '',
                          category: 'General inquiry',
                          organization: '',
                          message: '',
                          consent: false,
                          honeypot: '',
                        });
                        setFieldErrors({});
                      }}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
                    >
                      <span>Send Another Inquiry</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive Live Form */
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  {/* Delivery Disabled Notice */}
                  {deliveryDisabled && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
                      <Info className="h-5 w-5 shrink-0 text-amber-400" />
                      <div>
                        <div className="font-bold">Email Delivery Offline</div>
                        <div className="mt-0.5 text-amber-300/80 leading-relaxed">
                          Email delivery is currently disabled in this environment (<code>EMAIL_DELIVERY_ENABLED=false</code>).
                          In production, configure verified Resend credentials to receive live inquiries.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rate Limited or Generic Error Banner */}
                  {errorMessage && !deliveryDisabled && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300">
                      <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
                      <div>
                        <div className="font-bold">{rateLimited ? 'Rate Limit Exceeded' : 'Submission Error'}</div>
                        <div className="mt-0.5 text-rose-300/80">{errorMessage}</div>
                      </div>
                    </div>
                  )}

                  {/* Anti-Bot Honeypot Field */}
                  <div style={{ display: 'none' }} aria-hidden="true">
                    <label htmlFor={honeypotId}>Do not fill this field</label>
                    <input
                      id={honeypotId}
                      type="text"
                      tabIndex={-1}
                      autoComplete="off"
                      value={formData.honeypot}
                      onChange={(e) => setFormData({ ...formData, honeypot: e.target.value })}
                    />
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={nameId} className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Your Name <span className="text-blue-400">*</span>
                      </label>
                      <input
                        id={nameId}
                        type="text"
                        placeholder="Alex Morgan"
                        required
                        aria-describedby={fieldErrors.name ? `${nameId}-error` : undefined}
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: null });
                        }}
                        disabled={loading}
                        className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.name
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      />
                      {fieldErrors.name && (
                        <p id={`${nameId}-error`} className="mt-1 text-[11px] text-rose-400 font-medium">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor={emailId} className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Email Address <span className="text-blue-400">*</span>
                      </label>
                      <input
                        id={emailId}
                        type="email"
                        placeholder="alex@organization.edu"
                        required
                        aria-describedby={fieldErrors.email ? `${emailId}-error` : undefined}
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
                        }}
                        disabled={loading}
                        className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                          fieldErrors.email
                            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                            : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                        }`}
                      />
                      {fieldErrors.email && (
                        <p id={`${emailId}-error`} className="mt-1 text-[11px] text-rose-400 font-medium">
                          {fieldErrors.email}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Category & Organization Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={categoryId} className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Category
                      </label>
                      <select
                        id={categoryId}
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={organizationId} className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                        Organization Name (Optional)
                      </label>
                      <input
                        id={organizationId}
                        type="text"
                        placeholder="e.g. Apex University, TechCorp"
                        value={formData.organization}
                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                        disabled={loading}
                        className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label htmlFor={subjectId} className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Subject <span className="text-blue-400">*</span>
                    </label>
                    <input
                      id={subjectId}
                      type="text"
                      placeholder="Inquiry regarding multi-tenant ballot configuration"
                      required
                      aria-describedby={fieldErrors.subject ? `${subjectId}-error` : undefined}
                      value={formData.subject}
                      onChange={(e) => {
                        setFormData({ ...formData, subject: e.target.value });
                        if (fieldErrors.subject) setFieldErrors({ ...fieldErrors, subject: null });
                      }}
                      disabled={loading}
                      className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.subject
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldErrors.subject && (
                      <p id={`${subjectId}-error`} className="mt-1 text-[11px] text-rose-400 font-medium">
                        {fieldErrors.subject}
                      </p>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor={messageId} className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Message <span className="text-blue-400">*</span>
                    </label>
                    <textarea
                      id={messageId}
                      rows={5}
                      placeholder="Please describe your election structure, voter volume, or technical requirements..."
                      required
                      aria-describedby={fieldErrors.message ? `${messageId}-error` : undefined}
                      value={formData.message}
                      onChange={(e) => {
                        setFormData({ ...formData, message: e.target.value });
                        if (fieldErrors.message) setFieldErrors({ ...fieldErrors, message: null });
                      }}
                      disabled={loading}
                      className={`w-full rounded-2xl border bg-slate-950 px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                        fieldErrors.message
                          ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
                          : 'border-slate-800 focus:border-blue-500 focus:ring-blue-500/20'
                      }`}
                    />
                    {fieldErrors.message && (
                      <p id={`${messageId}-error`} className="mt-1 text-[11px] text-rose-400 font-medium">
                        {fieldErrors.message}
                      </p>
                    )}
                  </div>

                  {/* Consent Checkbox */}
                  <div>
                    <label htmlFor={consentId} className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        id={consentId}
                        type="checkbox"
                        checked={formData.consent}
                        onChange={(e) => {
                          setFormData({ ...formData, consent: e.target.checked });
                          if (fieldErrors.consent) setFieldErrors({ ...fieldErrors, consent: null });
                        }}
                        disabled={loading}
                        className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500/30"
                      />
                      <span className="text-xs text-slate-400 leading-normal">
                        I understand VoteSphere will use my details to respond to this request.
                      </span>
                    </label>
                    {fieldErrors.consent && (
                      <p className="mt-1 text-[11px] text-rose-400 font-medium">
                        {fieldErrors.consent}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 px-6 py-3.5 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{loading ? 'Transmitting...' : 'Send Live Inquiry'}</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
