"use client";

import { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface ForecastDataPoint {
  week: string;
  weekDate?: string;
  actual: number | null;
  predicted: number | null;
  lower: number | null;
  upper: number | null;
}

interface ChartPoint extends ForecastDataPoint {
  ciWidth: number | null;
}

interface ForecastAreaChartProps {
  data: ForecastDataPoint[];
}

function formatCount(value: number): string {
  return Math.round(value).toLocaleString();
}

function TrendTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
}) {
  if (!active || !payload?.[0]) return null;
  const row = payload[0].payload;
  const isForecast = row.actual == null && row.predicted != null;

  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-md">
      <p className="mb-1.5 font-medium">
        {row.weekDate ? `Week of ${row.week}` : row.week}
      </p>
      {row.actual != null && (
        <p>
          Confirmed:{" "}
          <span className="font-semibold">{formatCount(row.actual)}</span>
        </p>
      )}
      {isForecast && row.predicted != null && (
        <p className="text-primary">
          Forecast:{" "}
          <span className="font-semibold">{formatCount(row.predicted)}</span>
        </p>
      )}
      {row.lower != null && row.upper != null && (
        <p className="text-muted-foreground">
          95% CI: {formatCount(row.lower)}–{formatCount(row.upper)}
        </p>
      )}
    </div>
  );
}

/**
 * Confirmed dengue trend with optional 4-week LSTM forecast and 95% CI band.
 */
export function ForecastAreaChart({ data }: ForecastAreaChartProps) {
  const uid = useId().replace(/:/g, "");
  const actualFillId = `actual-fill-${uid}`;
  const ciFillId = `ci-fill-${uid}`;

  const series = useMemo<ChartPoint[]>(
    () =>
      data.map((point) => ({
        ...point,
        ciWidth:
          point.upper != null && point.lower != null
            ? point.upper - point.lower
            : null,
      })),
    [data],
  );

  const forecastStart = useMemo(
    () => series.find((point) => point.actual == null && point.predicted != null)?.week,
    [series],
  );

  const hasActual = series.some((point) => point.actual != null);
  const hasForecast = series.some((point) => point.predicted != null);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={series}
        margin={{ top: 12, right: 16, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id={actualFillId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-foreground)"
              stopOpacity={0.16}
            />
            <stop
              offset="100%"
              stopColor="var(--color-foreground)"
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient id={ciFillId} x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity={0.28}
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity={0.04}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="var(--color-border)"
          vertical={false}
        />
        <XAxis
          dataKey="week"
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          minTickGap={12}
        />
        <YAxis
          stroke="var(--color-muted-foreground)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={48}
        />
        <Tooltip
          content={<TrendTooltip />}
          cursor={{ stroke: "var(--color-border)", strokeDasharray: "4 4" }}
        />
        {forecastStart && (
          <ReferenceLine
            x={forecastStart}
            stroke="var(--color-primary)"
            strokeOpacity={0.45}
            strokeDasharray="4 4"
            label={{
              value: "Forecast",
              position: "insideTopRight",
              fill: "var(--color-muted-foreground)",
              fontSize: 10,
            }}
          />
        )}
        {hasActual && (
          <Area
            type="monotone"
            dataKey="actual"
            stroke="none"
            fill={`url(#${actualFillId})`}
            legendType="none"
            isAnimationActive={false}
          />
        )}
        {hasForecast && (
          <Area
            type="monotone"
            dataKey="lower"
            stackId="ci"
            stroke="none"
            fill="transparent"
            legendType="none"
            connectNulls
            isAnimationActive={false}
          />
        )}
        {hasForecast && (
          <Area
            type="monotone"
            dataKey="ciWidth"
            stackId="ci"
            stroke="none"
            fill={`url(#${ciFillId})`}
            name="95% CI"
            connectNulls
            isAnimationActive={false}
          />
        )}
        {hasActual && (
          <Line
            type="monotone"
            dataKey="actual"
            name="Confirmed cases"
            stroke="var(--color-foreground)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--color-foreground)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        )}
        {hasForecast && (
          <Line
            type="monotone"
            dataKey="predicted"
            name="LSTM forecast"
            stroke="var(--color-primary)"
            strokeWidth={2.5}
            strokeDasharray="6 4"
            connectNulls
            dot={{ r: 3.5, fill: "var(--color-primary)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        )}
        <Legend
          verticalAlign="bottom"
          height={28}
          iconType="plainline"
          wrapperStyle={{ fontSize: 12 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
