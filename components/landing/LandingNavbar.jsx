'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Vote,
  ArrowRight,
  Shield,
  Layers,
  HelpCircle,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

export default function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-105">
            <Vote className="h-5 w-5" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black tracking-tight text-white">
              Vote<span className="text-blue-400">Sphere</span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <a href="#features" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-blue-400" />
            Features
          </a>
          <a href="#how-it-works" className="hover:text-white transition-colors flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            How It Works
          </a>
          <a href="#security" className="hover:text-white transition-colors flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-indigo-400" />
            Security & Trust
          </a>
          <a href="#faq" className="hover:text-white transition-colors flex items-center gap-1.5">
            <HelpCircle className="h-4 w-4 text-purple-400" />
            FAQ
          </a>
        </nav>

        {/* Desktop CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/auth/login"
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition-all"
          >
            Sign In
          </Link>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-500/25 transition-all"
          >
            Get Started
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/auth/login"
            className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 rounded-lg border border-slate-800"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
            >
              <Layers className="h-4 w-4 text-blue-400" />
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              How It Works
            </a>
            <a
              href="#security"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
            >
              <Shield className="h-4 w-4 text-indigo-400" />
              Security & Trust
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900"
            >
              <HelpCircle className="h-4 w-4 text-purple-400" />
              FAQ
            </a>
          </nav>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            <Link
              href="/auth/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-3 text-center text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
