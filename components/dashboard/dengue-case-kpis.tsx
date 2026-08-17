"use client";

import { Activity, CalendarRange, Loader2, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DengueCaseSummaryDTO } from "@/lib/types";

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

function formatWeekRange(summary: DengueCaseSummaryDTO | null): string {
  if (!summary?.lastWeekStartDate) return "No weekly case rows uploaded yet";
  const end = summary.lastWeekEndDate ?? summary.lastWeekStartDate;
  return `${summary.lastWeekStartDate} – ${end} · ${summary.lastWeekRdhsCount}/${summary.lastWeekRdhsExpected} RDHS`;
}

interface DengueCaseKpisProps {
  summary: DengueCaseSummaryDTO | null;
  loading?: boolean;
  districtName?: string | null;
}

export function DengueCaseKpis({
  summary,
  loading,
  districtName,
}: DengueCaseKpisProps) {
  const resolvedDistrict =
    summary?.districtName ?? districtName ?? null;
  const districtLabel = resolvedDistrict
    ? `${resolvedDistrict} this year`
    : "District this year";

  const cards = [
    {
      label: "Sri Lanka dengue cases",
      value: formatCount(summary?.lastWeekCumulativeTotal),
      delta: "Last week cumulative_cases sum (26 RDHS)",
      icon: Activity,
    },
    {
      label: "Last week cases",
      value: formatCount(summary?.lastWeekCases),
      delta: formatWeekRange(summary),
      icon: CalendarRange,
    },
  ];

  if (summary?.scopedToDistrict || districtName) {
    cards.push({
      label: districtLabel,
      value: formatCount(
        summary?.districtYearCumulative ?? summary?.districtYearCases,
      ),
      delta: `Year-to-date cumulative · last week ${formatCount(summary?.districtLastWeekCases)}`,
      icon: MapPin,
    });
  }

  return (
    <div
      className={
        cards.length === 3
          ? "grid gap-4 md:grid-cols-3"
          : "grid gap-4 md:grid-cols-2"
      }
    >
      {cards.map((s) => (
        <Card key={s.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {s.label}
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tracking-tight">
              {loading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                s.value
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
