"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  CalendarRange,
  Info,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { GeneratePredictionButton } from "@/components/dashboard/generate-prediction-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  apiGetDengueCaseSummary,
  apiGetLatestForecast,
  apiGetWeeklyCases,
} from "@/lib/api";
import { rdhsNameFromId } from "@/lib/districts";
import {
  canTriggerForecast,
  isSameWeekPrediction,
  targetWeekAfterLatest,
} from "@/lib/forecasts";
import { useAppStore } from "@/stores/app-store";
import type {
  DengueCaseSummaryDTO,
  DistrictForecastResponseDTO,
} from "@/lib/types";

const ChartLoadingFallback = () => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
    Loading chart…
  </div>
);

const ForecastAreaChart = dynamic(
  () =>
    import("@/components/dashboard/charts/forecast-area-chart").then(
      (m) => m.ForecastAreaChart,
    ),
  { ssr: false, loading: ChartLoadingFallback },
);

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value.slice(0, 10)
    : d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
}

async function loadDistrictForecast(rdhsId: number, districtName: string) {
  const [forecast, sum, cases] = await Promise.all([
    apiGetLatestForecast(rdhsId),
    apiGetDengueCaseSummary().catch(() => null),
    apiGetWeeklyCases(0, 1, { district: districtName }).catch(() => null),
  ]);
  return {
    forecast,
    sum,
    latestWeekStart: cases?.content?.[0]?.weekStartDate ?? null,
    latestWeekEnd: cases?.content?.[0]?.weekEndDate ?? null,
  };
}

export default function DistrictForecastPage() {
  const params = useParams<{ rdhsId: string }>();
  const rdhsId = Number(params.rdhsId);
  const districtName = Number.isFinite(rdhsId) ? rdhsNameFromId(rdhsId) : null;

  const user = useAppStore((s) => s.user);
  const canTrigger = canTriggerForecast(user, rdhsId);

  const [forecast, setForecast] = useState<DistrictForecastResponseDTO | null>(
    null,
  );
  const [summary, setSummary] = useState<DengueCaseSummaryDTO | null>(null);
  const [latestWeekStart, setLatestWeekStart] = useState<string | null>(null);
  const [latestWeekEnd, setLatestWeekEnd] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const applyForecast = useCallback(
    (data: Awaited<ReturnType<typeof loadDistrictForecast>>) => {
      setForecast(data.forecast);
      setSummary(data.sum);
      setLatestWeekStart(data.latestWeekStart);
      setLatestWeekEnd(data.latestWeekEnd);
      setLoading(false);
    },
    [],
  );

  useEffect(() => {
    if (!districtName) return;
    let cancelled = false;
    loadDistrictForecast(rdhsId, districtName)
      .then((data) => {
        if (!cancelled) applyForecast(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(
          err instanceof Error
            ? err.message
            : `Failed to load forecast for ${districtName}`,
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [districtName, rdhsId, applyForecast]);

  const refresh = () => {
    if (!districtName) return;
    setLoading(true);
    loadDistrictForecast(rdhsId, districtName)
      .then(applyForecast)
      .catch((err: unknown) => {
        toast.error(
          err instanceof Error
            ? err.message
            : `Failed to load forecast for ${districtName}`,
        );
        setLoading(false);
      });
  };

  const targetWeekStart = targetWeekAfterLatest(latestWeekStart);
  const alreadyCurrent = isSameWeekPrediction(forecast, targetWeekStart);
  const hasPrediction =
    forecast != null && (forecast.predictions?.length ?? 0) > 0;

  const chartData = useMemo(
    () =>
      (forecast?.predictions ?? []).map((predicted, i) => ({
        week: `W+${i + 1}`,
        actual: null as number | null,
        predicted,
        lower: forecast?.lowerBounds?.[i] ?? null,
        upper: forecast?.upperBounds?.[i] ?? null,
      })),
    [forecast],
  );

  const projectedPeak = useMemo(() => {
    if (!forecast?.predictions?.length) return null;
    return forecast.predictions.reduce(
      (max, value, index) =>
        value > max.value ? { value, index } : max,
      { value: forecast.predictions[0], index: 0 },
    );
  }, [forecast]);

  if (!districtName) {
    return (
      <DashboardShell title="Forecasts">
        <Card>
          <CardHeader>
            <CardTitle>District not found</CardTitle>
            <CardDescription>
              No RDHS zone matches this id. Pick a district from the forecasts
              list.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/forecasts">
                <ArrowLeft className="h-4 w-4" />
                Back to forecasts
              </Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={`${districtName} forecast`}>
      <Card>
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              {districtName}
            </CardTitle>
            <CardDescription>
              {loading
                ? "Checking latest dengue data and prediction status…"
                : hasPrediction
                  ? `Generated ${formatDate(forecast?.generatedAt)} for the week of ${formatDate(forecast?.targetWeekStart)}`
                  : "No prediction has been generated yet for this RDHS."}
            </CardDescription>
            {!loading && (
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                <span>
                  Last dengue week:{" "}
                  <strong className="text-foreground">
                    {formatDate(latestWeekStart)}
                    {latestWeekEnd ? ` – ${formatDate(latestWeekEnd)}` : ""}
                  </strong>
                </span>
                {targetWeekStart && (
                  <span>
                    Forecast:{" "}
                    <strong className="text-foreground">
                      4 weeks from {formatDate(targetWeekStart)}
                    </strong>
                  </span>
                )}
                {forecast?.status === "STALE" && (
                  <Badge variant="secondary">Stale</Badge>
                )}
                {hasPrediction &&
                  (alreadyCurrent ? (
                    <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 dark:text-emerald-400">
                      Up to date
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 dark:text-amber-400">
                      New data available
                    </Badge>
                  ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {user?.role !== "PHI" && (
              <Button asChild variant="outline">
                <Link href="/dashboard/forecasts">
                  <ArrowLeft className="h-4 w-4" />
                  All RDHS
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={refresh}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            {canTrigger && (
              <GeneratePredictionButton
                rdhsId={rdhsId}
                districtName={districtName}
                alreadyCurrent={alreadyCurrent}
                locked={loading}
                latestWeekLabel={formatDate(targetWeekStart)}
                onStart={() => setGenerateError(null)}
                onGenerated={(record) => {
                  setGenerateError(null);
                  if (record) setForecast(record);
                  else refresh();
                }}
                onError={(err) => {
                  setGenerateError(err.message);
                }}
              />
            )}
          </div>
        </CardHeader>

        {canTrigger && generateError && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {/insufficient|consecutive weeks/i.test(generateError)
                  ? "Not enough history to generate"
                  : "Prediction failed"}
              </AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{generateError}</p>
                {/insufficient|consecutive weeks/i.test(generateError) && (
                  <p>
                    The LSTM model uses the 8 consecutive weeks of dengue cases{" "}
                    <em>and</em> weather ending on this RDHS&apos;s latest
                    dengue-case week, then predicts the next 4 weeks. Upload any
                    missing weeks on{" "}
                    <Link
                      href="/dashboard/cases"
                      className="font-medium underline underline-offset-2"
                    >
                      Weekly Cases
                    </Link>
                    , then try Generate Prediction again.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        )}

        {canTrigger && alreadyCurrent && !generateError && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                A prediction already covers the 4 weeks after the latest dengue
                record
                {targetWeekStart ? ` (${formatDate(targetWeekStart)})` : ""}.
                Same-week forecasts are not regenerated.
              </span>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last week cases
            </CardTitle>
            <CalendarRange className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {summary?.districtLastWeekCases != null
                ? summary.districtLastWeekCases.toLocaleString()
                : summary?.lastWeekCases != null
                  ? summary.lastWeekCases.toLocaleString()
                  : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Through {formatDate(latestWeekEnd)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected peak
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {projectedPeak ? `W+${projectedPeak.index + 1}` : "—"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {projectedPeak
                ? `~${Math.round(projectedPeak.value)} confirmed cases`
                : "No forecast yet"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>LSTM outbreak forecast</CardTitle>
          <CardDescription>
            Confirmed cases with 95% confidence interval for {districtName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full sm:h-96">
            {loading ? (
              <ChartLoadingFallback />
            ) : hasPrediction ? (
              <ForecastAreaChart data={chartData} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Brain className="h-8 w-8" />
                <p>No prediction available yet for {districtName}.</p>
                {canTrigger && (
                  <p className="text-xs">
                    Generate a prediction from the latest dengue-case week (8
                    weeks of history → next 4 weeks).
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
