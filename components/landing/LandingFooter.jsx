import Link from 'next/link';
import { Vote, Heart } from 'lucide-react';

export default function LandingFooter() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand & Description */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Vote className="h-4 w-4" />
            </div>
            <span className="text-lg font-black text-white tracking-tight">
              Vote<span className="text-blue-400">Sphere</span>
            </span>
          </div>
          <p className="text-sm text-slate-400 max-w-sm leading-relaxed font-normal">
            The modern, multi-tenant online voting platform engineered for universities, student
            councils, organizations, and clubs. Verifiable secrecy and certified outcomes.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
          <ul className="space-y-2.5 text-sm font-normal">
            <li>
              <a href="#features" className="hover:text-white transition-colors">
                Key Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </a>
            </li>
            <li>
              <a href="#security" className="hover:text-white transition-colors">
                Cryptographic Security
              </a>
            </li>
            <li>
              <Link href="/auth/signup" className="hover:text-white transition-colors">
                Create Organization
              </Link>
            </li>
          </ul>
        </div>

        {/* Access & Portals */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Portals</h4>
          <ul className="space-y-2.5 text-sm font-normal">
            <li>
              <Link href="/auth/login" className="hover:text-white transition-colors">
                Voter Login
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-white transition-colors">
                Admin Dashboard
              </Link>
            </li>
            <li>
              <Link href="/docs/api" className="hover:text-white transition-colors">
                API Reference
              </Link>
            </li>
            <li>
              <Link href="/docs/voting-system" className="hover:text-white transition-colors">
                Voting System Protocol
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright & Badges */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium">
        <div>
          © {new Date().getFullYear()} VoteSphere. All rights reserved. Built with pride for democratic integrity.
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <span>Crafted with</span>
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          <span>using Next.js 14, Tailwind CSS & Supabase</span>
        </div>
      </div>
    </footer>
  );
}
