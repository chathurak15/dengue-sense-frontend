import { Activity, CalendarRange, TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { formatCount, formatIsoWeekRange } from "@/lib/utils";
import type { CitizenOutbreakSummaryDTO } from "@/lib/types";

function riskClass(risk: string): string {
  if (risk === "HIGH")
    return "bg-red-500/15 text-red-700 dark:text-red-400";
  if (risk === "MEDIUM")
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
}

function formatChange(pct: number | null | undefined): {
  label: string;
  tone: "up" | "down" | "flat";
} {
  if (pct == null || Number.isNaN(pct)) {
    return { label: "No prior-week comparison", tone: "flat" };
  }
  const rounded = Math.round(pct);
  if (rounded === 0) return { label: "Unchanged vs prior week", tone: "flat" };
  const sign = rounded > 0 ? "+" : "";
  return {
    label: `${sign}${rounded}% vs prior week`,
    tone: rounded > 0 ? "up" : "down",
  };
}

export function NationalOutlook({
  summary,
}: {
  summary: CitizenOutbreakSummaryDTO | null;
}) {
  const change = formatChange(summary?.weekChangePercent);
  const risk = summary?.nationalRisk ?? "LOW";

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border bg-card/80 shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium">National dengue snapshot</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {summary
                ? formatIsoWeekRange(summary.weekStartDate, summary.weekEndDate)
                : "Live epidemiology totals"}
            </p>
            {summary?.banner ? (
              <p className="mt-2 text-sm text-foreground/80">{summary.banner}</p>
            ) : null}
          </div>
          {summary ? (
            <span
              className={`inline-flex shrink-0 self-start rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${riskClass(risk)}`}
            >
              {risk} risk
            </span>
          ) : null}
        </div>

        <div className="grid gap-px bg-border sm:grid-cols-3">
          <Stat
            icon={CalendarRange}
            label="Last week"
            value={summary ? formatCount(summary.lastWeekCases) : "—"}
            hint={
              summary
                ? `${formatCount(summary.previousWeekCases)} the week before`
                : "Confirmed cases, all RDHS"
            }
          />
          <Stat
            icon={Activity}
            label={`${summary?.year ?? "Year"} to date`}
            value={summary ? formatCount(summary.yearCases) : "—"}
            hint="National confirmed dengue"
          />
          <Stat
            icon={change.tone === "down" ? TrendingDown : TrendingUp}
            label="Week-over-week"
            value={
              summary?.weekChangePercent == null
                ? "—"
                : `${summary.weekChangePercent > 0 ? "+" : ""}${Math.round(summary.weekChangePercent)}%`
            }
            hint={change.label}
            valueClass={
              change.tone === "up"
                ? "text-red-600 dark:text-red-400"
                : change.tone === "down"
                  ? "text-emerald-600 dark:text-emerald-400"
                  : undefined
            }
          />
        </div>

        {summary?.highDistricts && summary.highDistricts.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 px-6 py-3">
            <span className="text-xs text-muted-foreground">Higher this week</span>
            {summary.highDistricts.map((name) => (
              <span
                key={name}
                className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs"
              >
                {name}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  valueClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  valueClass?: string;
}) {
  return (
    <div className="bg-card px-6 py-5">
      <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-3xl font-semibold tracking-tight tabular-nums ${valueClass ?? ""}`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
