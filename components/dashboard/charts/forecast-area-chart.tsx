"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ForecastDataPoint {
  week: string;
  actual: number | null;
  predicted: number | null;
  lower: number | null;
  upper: number | null;
}

interface ForecastAreaChartProps {
  data: ForecastDataPoint[];
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-popover-foreground)",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * LSTM outbreak forecast with 95% confidence interval shading.
 * Loaded via next/dynamic({ ssr: false }) from dashboard/forecasts/page.tsx.
 */
export function ForecastAreaChart({ data }: ForecastAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
      >
        <defs>
          <linearGradient id="ci-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor="var(--color-primary)"
              stopOpacity={0.35}
            />
            <stop
              offset="100%"
              stopColor="var(--color-primary)"
              stopOpacity={0.02}
            />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="week"
          stroke="var(--color-muted-foreground)"
          fontSize={12}
        />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Area
          type="monotone"
          dataKey="upper"
          stroke="none"
          fill="url(#ci-gradient)"
          name="CI upper"
        />
        <Area
          type="monotone"
          dataKey="lower"
          stroke="none"
          fill="var(--color-background)"
          name="CI lower"
        />
        <Line
          type="monotone"
          dataKey="actual"
          name="Actual"
          stroke="var(--color-foreground)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="predicted"
          name="Predicted"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
