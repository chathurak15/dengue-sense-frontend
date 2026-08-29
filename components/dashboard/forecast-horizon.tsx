import { TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { forecastWeekDate } from "@/lib/forecasts";
import { formatCount, formatIsoDate } from "@/lib/utils";
import type { DistrictForecastResponseDTO } from "@/lib/types";

interface ForecastHorizonProps {
  forecast: DistrictForecastResponseDTO | null;
  lastWeekCases?: number | null;
}

export function ForecastHorizon({
  forecast,
  lastWeekCases,
}: ForecastHorizonProps) {
  const predictions = forecast?.predictions ?? [];
  if (predictions.length === 0) return null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {predictions.map((predicted, i) => {
        const weekStart = forecastWeekDate(forecast?.targetWeekStart, i);
        const rounded = Math.round(predicted);
        const delta =
          i === 0 && lastWeekCases != null && lastWeekCases > 0
            ? Math.round(((predicted - lastWeekCases) / lastWeekCases) * 100)
            : null;
        const lower = forecast?.lowerBounds?.[i];
        const upper = forecast?.upperBounds?.[i];

        return (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                <span>Week {i + 1}</span>
                <span className="text-xs font-normal">
                  {formatIsoDate(weekStart)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {formatCount(rounded)}
              </p>
              {delta != null && (
                <p
                  className={
                    delta > 0
                      ? "mt-1 inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
                      : delta < 0
                        ? "mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400"
                        : "mt-1 text-xs text-muted-foreground"
                  }
                >
                  {delta > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : delta < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {delta > 0 ? "+" : ""}
                  {delta}% vs last confirmed week
                </p>
              )}
              {lower != null && upper != null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  95% CI {formatCount(Math.round(lower))}–
                  {formatCount(Math.round(upper))}
                </p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
