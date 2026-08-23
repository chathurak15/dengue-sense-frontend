"use client";

import { Activity, CalendarRange, Loader2, MapPin } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCount, formatIsoWeekRange } from "@/lib/utils";
import type { DengueCaseSummaryDTO } from "@/lib/types";

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
  const resolvedDistrict = summary?.districtName ?? districtName ?? null;
  const year = summary?.year;
  const coverageExpected = summary?.lastWeekRdhsExpected ?? 0;
  const coverageCount = summary?.lastWeekRdhsCount ?? 0;
  const coveragePct =
    coverageExpected > 0
      ? Math.round((coverageCount / coverageExpected) * 100)
      : 0;

  const cards = [
    {
      label: "Last week cases",
      value: formatCount(summary?.lastWeekCases),
      delta: formatIsoWeekRange(
        summary?.lastWeekStartDate,
        summary?.lastWeekEndDate,
      ),
      icon: CalendarRange,
    },
    {
      label: year ? `${year} year-to-date` : "Year-to-date",
      value: formatCount(
        summary?.nationalYearCases ?? summary?.lastWeekCumulativeTotal,
      ),
      delta: "Confirmed dengue across 26 RDHS",
      icon: Activity,
    },
  ];

  if (summary?.scopedToDistrict || districtName) {
    cards.push({
      label: resolvedDistrict
        ? `${resolvedDistrict} this year`
        : "District this year",
      value: formatCount(
        summary?.districtYearCumulative ?? summary?.districtYearCases,
      ),
      delta: `Last week ${formatCount(summary?.districtLastWeekCases)}`,
      icon: MapPin,
    });
  }

  return (
    <div className="space-y-4">
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

      <Card>
        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Last-week RDHS coverage</p>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Loading reporting coverage…"
                : `${coverageCount} of ${coverageExpected || 26} divisions have last-week case rows`}
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:max-w-xs">
            <Progress value={loading ? 0 : coveragePct} className="h-2" />
            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
              {loading ? "—" : `${coveragePct}%`}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
