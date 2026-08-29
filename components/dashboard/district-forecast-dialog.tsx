"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Brain, ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGetLatestForecast } from "@/lib/api";
import type { DistrictForecastResponseDTO } from "@/lib/types";

const ForecastAreaChart = dynamic(
  () =>
    import("@/components/dashboard/charts/forecast-area-chart").then(
      (m) => m.ForecastAreaChart,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chart…
      </div>
    ),
  },
);

interface DistrictForecastDialogProps {
  open: boolean;
  rdhsId: number | null;
  districtName: string;
  onOpenChange: (open: boolean) => void;
}

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

export function DistrictForecastDialog({
  open,
  rdhsId,
  districtName,
  onOpenChange,
}: DistrictForecastDialogProps) {
  const [result, setResult] = useState<{
    rdhsId: number;
    forecast: DistrictForecastResponseDTO | null;
    error: string | null;
  } | null>(null);

  useEffect(() => {
    if (!open || rdhsId == null) return;
    let cancelled = false;
    apiGetLatestForecast(rdhsId)
      .then((data) => {
        if (!cancelled) {
          setResult({ rdhsId, forecast: data, error: null });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setResult({
            rdhsId,
            forecast: null,
            error:
              err instanceof Error
                ? err.message
                : `Failed to load forecast for ${districtName}`,
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, rdhsId, districtName]);

  const loading = open && rdhsId != null && result?.rdhsId !== rdhsId;
  const forecast = result?.rdhsId === rdhsId ? result.forecast : null;
  const error = result?.rdhsId === rdhsId ? result.error : null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {districtName} forecast
          </DialogTitle>
          <DialogDescription>
            {loading
              ? "Loading the latest LSTM prediction…"
              : error
                ? "Could not load this RDHS forecast."
                : hasPrediction
                  ? `Generated ${formatDate(forecast?.generatedAt)} for the week of ${formatDate(forecast?.targetWeekStart)}`
                  : "No prediction has been generated yet for this RDHS."}
          </DialogDescription>
        </DialogHeader>

        {forecast?.status === "STALE" && (
          <Badge variant="secondary" className="w-fit">
            Stale
          </Badge>
        )}

        <div className="h-64 w-full sm:h-80">
          {loading ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading forecast…
            </div>
          ) : error ? (
            <div className="flex h-full items-center justify-center text-center text-sm text-destructive">
              {error}
            </div>
          ) : hasPrediction ? (
            <ForecastAreaChart data={chartData} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
              <Brain className="h-8 w-8" />
              <p>No prediction available yet for {districtName}.</p>
            </div>
          )}
        </div>

        {rdhsId != null && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/forecasts/${rdhsId}`}>
                Open full forecast
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
