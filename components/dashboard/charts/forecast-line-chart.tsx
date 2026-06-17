"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChartDataPoint {
  week: string;
  historical: number | null;
  predicted: number | null;
}

interface ForecastLineChartProps {
  data: ChartDataPoint[];
}

// ─── Tooltip style (stable object — defined outside to avoid re-renders) ──────

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-popover-foreground)",
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Historical Cases vs AI Prediction line chart.
 * Loaded via next/dynamic({ ssr: false }) from dashboard/page.tsx
 * to prevent Recharts from running on the server.
 */
export function ForecastLineChart({ data }: ForecastLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="week"
          stroke="var(--color-muted-foreground)"
          fontSize={12}
        />
        <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend />
        <Line
          type="monotone"
          dataKey="historical"
          name="Historical"
          stroke="var(--color-foreground)"
          strokeWidth={2}
          dot={false}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="predicted"
          name="AI Prediction"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={{ r: 3 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
