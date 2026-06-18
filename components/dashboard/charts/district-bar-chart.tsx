"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistrictDataPoint {
  name: string;
  current: number;
  forecast: number;
  change: number;
}

interface DistrictBarChartProps {
  data: DistrictDataPoint[];
}

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * District-level current vs forecast bar chart.
 * Loaded via next/dynamic({ ssr: false }) from dashboard/forecasts/page.tsx.
 */
export function DistrictBarChart({ data }: DistrictBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="name"
          stroke="var(--color-muted-foreground)"
          fontSize={12}
        />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Bar
          dataKey="current"
          name="Current"
          fill="var(--color-muted-foreground)"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="forecast"
          name="Forecast"
          fill="var(--color-primary)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
