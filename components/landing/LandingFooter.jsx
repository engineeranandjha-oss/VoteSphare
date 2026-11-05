'use client';

import Link from 'next/link';
import Logo from '@/components/common/Logo';
import {
  Vote,
  Lock,
  ArrowRight,
  HelpCircle,
  Mail,
  Building2,
  GraduationCap,
  Briefcase,
  Home,
  HeartHandshake,
  Users,
  CheckCircle2,
} from 'lucide-react';

export default function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 py-16 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-7xl mx-auto">
        {/* Main 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          
          {/* Column 1 — VoteSphere */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5 group">
              <Logo size={36} className="group-hover:scale-105 transition-transform duration-200" />
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Vote<span className="text-blue-600 dark:text-blue-400">Sphere</span>
              </span>
            </Link>

            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              The modern, cryptographically verifiable online election platform built for organizations, academies, and communities.
            </p>

            <div className="pt-1 space-y-2">
              <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Lock className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Zero-knowledge ballot secrecy with permanent voter dissociation.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400/90 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>SHA-256 verifiable ballot receipt ledger</span>
              </div>
            </div>
          </div>

          {/* Column 2 — Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Vote className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/pricing"
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline transition-colors duration-150 flex items-center gap-1.5"
                >
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <Link
                  href="/how-it-works"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  href="/join"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  Join an Election
                </Link>
              </li>
              <li>
                <Link
                  href="/onboarding/organization"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  Create an Election
                </Link>
              </li>
              <li>
                <Link
                  href="/organizations"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  For Organizations
                </Link>
              </li>
              <li>
                <Link
                  href="/security"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  Security & Privacy
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 — Solutions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
              Solutions
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/organizations/schools"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <GraduationCap className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Schools & Colleges
                </Link>
              </li>
              <li>
                <Link
                  href="/organizations/universities"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Universities & Colleges
                </Link>
              </li>
              <li>
                <Link
                  href="/organizations/companies"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <Briefcase className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Companies & Teams
                </Link>
              </li>
              <li>
                <Link
                  href="/organizations/societies"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <Home className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Residential Societies
                </Link>
              </li>
              <li>
                <Link
                  href="/organizations/ngos"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <HeartHandshake className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  NGOs & Non-Profits
                </Link>
              </li>
              <li>
                <Link
                  href="/organizations/families"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  <Users className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                  Families & Groups
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 — Support & Contact */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
              Support & Contact
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  href="/help"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  Contact Support
                </Link>
              </li>
              <li>
                <Link
                  href="/contact?category=Bug+report"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  Report an Issue
                </Link>
              </li>
              <li>
                <Link
                  href="/help#faq"
                  className="hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1.5"
                >
                  FAQs
                </Link>
              </li>
            </ul>

            {/* Prominent Contact Support CTA */}
            <div className="pt-2">
              <Link
                href="/contact"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 font-bold text-xs text-white shadow-lg shadow-blue-500/20 transition-all duration-200 border border-blue-400/20 group"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>Contact Support</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform duration-150" />
              </Link>
            </div>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Legal */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} VoteSphere. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
            >
              Privacy Policy
            </Link>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <Link
              href="/terms"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

