import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Brain, FileSpreadsheet, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NationalOutlook } from "@/components/home/national-outlook";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HomeAppTeaser } from "@/components/app-promo/home-teaser";
import { apiGetPublicOutbreakSummary } from "@/lib/api";

export const metadata: Metadata = {
  title: "DengueSense LK: Dengue surveillance for Sri Lanka",
  description:
    "Weekly dengue case intelligence and 4-week LSTM outbreak forecasting for Sri Lanka’s 26 RDHS divisions.",
};

const features = [
  {
    icon: FileSpreadsheet,
    title: "Weekly case intelligence",
    desc: "Confirmed dengue by RDHS, week by week, with national and district summaries from records already in the system.",
  },
  {
    icon: Brain,
    title: "4-week LSTM forecast",
    desc: "A time-series model projects the coming month for each RDHS, with confidence bounds health teams can act on.",
  },
  {
    icon: MapPinned,
    title: "District operations",
    desc: "PHI, MOH, and epidemiology staff see the same case totals and outlook for the zone they are assigned to.",
  },
];

export default async function LandingPage() {
  const summary = await apiGetPublicOutbreakSummary().catch(() => null);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 right-[-8rem] h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-[28rem] -left-32 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <SiteHeader active="home" />

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-12 pt-16 sm:px-6 sm:pb-16 sm:pt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Ministry of Health · 26 RDHS divisions
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              See dengue clearly.
              <span className="mt-1 block text-primary">Act a week earlier.</span>
            </h1>
            <p className="mt-5 text-pretty text-base text-muted-foreground sm:text-lg">
              A quiet workspace for weekly cases and four-week outbreak
              forecasts, built for public health teams in Sri Lanka.
            </p>
            <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <Button size="lg" className="h-11 gap-2 sm:h-10" asChild>
                <Link href="/login">
                  Enter the portal
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-11 sm:h-10" asChild>
                <Link href="/register">Request access</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Neighbour with a phone?{" "}
              <Link
                href="/app"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Get the citizen app
              </Link>
            </p>
          </div>
        </section>

        <NationalOutlook summary={summary} />

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-4 md:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card/70 p-6"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h2 className="text-base font-semibold">{f.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        <HomeAppTeaser />
      </main>

      <SiteFooter />
    </div>
  );
}
