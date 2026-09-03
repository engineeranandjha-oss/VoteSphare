import { CheckCircle2, ShieldCheck, Share2, Vote, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden p-6 sm:p-12 md:p-24">
      {/* Background Glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />

      {/* Header / Nav */}
      <div className="z-10 flex w-full max-w-5xl items-center justify-between font-mono text-sm">
        <div className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
            <Vote className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-xl font-extrabold text-transparent">
            VoteSphere
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span>V1 Foundation Ready</span>
        </div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 my-12 flex max-w-3xl flex-col items-center text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-xs font-medium text-primary backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Phase 1 • Module 1.1 Complete</span>
        </div>

        <h1 className="mb-6 bg-gradient-to-b from-foreground via-foreground/90 to-foreground/60 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-6xl">
          Simple. Secure. <br />
          <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
            Shareable Voting.
          </span>
        </h1>

        <p className="mb-8 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          The all-in-one voting platform designed for schools, universities, organizations, and
          clubs. Create elections, invite voters, and share certified live results.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <a
            href="#features"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            Explore Platform <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-6 text-sm font-medium text-secondary-foreground transition hover:bg-secondary/80"
          >
            Documentation
          </a>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div id="features" className="z-10 grid w-full max-w-5xl grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="group rounded-2xl border border-border/80 bg-card/50 p-6 backdrop-blur-md transition-all hover:border-border">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500 transition-transform group-hover:scale-105">
            <Vote className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-base font-semibold">Effortless Creation</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Multi-position ballots, candidate manifestos, photos, and customizable voting schedules
            in minutes.
          </p>
        </div>

        <div className="group rounded-2xl border border-border/80 bg-card/50 p-6 backdrop-blur-md transition-all hover:border-border">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-transform group-hover:scale-105">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-base font-semibold">Zero-Leak Security</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Cryptographically dissociated anonymous voting tokens with complete tenant-isolated
            authorization.
          </p>
        </div>

        <div className="group rounded-2xl border border-border/80 bg-card/50 p-6 backdrop-blur-md transition-all hover:border-border">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500 transition-transform group-hover:scale-105">
            <Share2 className="h-5 w-5" />
          </div>
          <h2 className="mb-2 text-base font-semibold">Instant Sharing</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            QR codes, direct token invites, and verifiable public results pages for high voter
            turnout.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-16 flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <span>VoteSphere Architecture • Next.js 14 App Router + Tailwind CSS</span>
      </div>
    </main>
  );
}
