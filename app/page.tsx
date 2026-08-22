import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Brain, LineChart, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "DengueSense LK: Proactive Dengue Surveillance for Sri Lanka",
  description:
    "AI-driven dengue surveillance for Sri Lanka. Citizen reporting, MobileNetV3 vector classification, and 4-week LSTM outbreak forecasting.",
};

// ─── Static Feature Data (defined outside component — zero re-render cost) ───

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

const features: Feature[] = [
  {
    icon: Users,
    title: "Citizen Crowdsourcing",
    desc: "Anyone can report suspected mosquito breeding sites with a photo and geolocation in seconds.",
  },
  {
    icon: Brain,
    title: "MobileNetV3 AI Classification",
    desc: "On-device computer vision classifies vector species and confirms breeding-site risk instantly.",
  },
  {
    icon: LineChart,
    title: "4-Week LSTM Forecasting",
    desc: "Time-series neural networks predict outbreak hotspots up to four weeks in advance.",
  },
];

// ─── Landing Page (React Server Component) ───────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </div>
            DengueSense <span className="text-primary">LK</span>
          </Link>

          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-1 sm:gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <main>
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Real-time vector surveillance
            </div>
            <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Proactive Dengue Surveillance for{" "}
              <span className="text-primary">Sri Lanka</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Empowering citizens and Public Health Inspectors with AI-driven
              insights and real-time vector tracking.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link href="/report">
                <Button size="lg" className="gap-2">
                  Report a Breeding Site <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  PHI Portal Login
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── Feature Cards ── */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-12 sm:px-6 sm:py-20 md:grid-cols-3 md:gap-8">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:px-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Ministry of Health, DengueSense LK
          </div>
          <span>© {new Date().getFullYear()} All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
