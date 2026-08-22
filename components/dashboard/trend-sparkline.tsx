"use client";

import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DistrictTrend } from "@/lib/district-summary";

interface TrendSparklineProps {
  values: number[];
  trend: DistrictTrend | null;
  percent: number | null;
}

function sparkPoints(values: number[], width: number, height: number) {
  const padX = 2;
  const padY = 3;
  const n = values.length;
  if (n === 0) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .map((v, i) => {
      const x =
        n === 1
          ? width / 2
          : padX + (i / (n - 1)) * (width - padX * 2);
      const y = height - padY - ((v - min) / range) * (height - padY * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export function TrendSparkline({ values, trend, percent }: TrendSparklineProps) {
  const stroke =
    trend === "up"
      ? "stroke-red-500"
      : trend === "down"
        ? "stroke-emerald-500"
        : "stroke-muted-foreground";
  const fill =
    trend === "up"
      ? "fill-red-500/15"
      : trend === "down"
        ? "fill-emerald-500/15"
        : "fill-muted-foreground/10";
  const labelColor =
    trend === "up"
      ? "text-red-600 dark:text-red-400"
      : trend === "down"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-muted-foreground";

  const width = 72;
  const height = 28;
  const points = sparkPoints(values, width, height);
  const areaPoints =
    points && values.length > 1
      ? `2,${height - 1} ${points} ${width - 2},${height - 1}`
      : "";

  const label =
    trend === "up"
      ? "Up"
      : trend === "down"
        ? "Down"
        : trend === "flat"
          ? "Flat"
          : "No data";

  return (
    <div className="flex items-center gap-2">
      {values.length >= 2 && points ? (
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width={width}
          height={height}
          className="shrink-0"
          aria-hidden
        >
          {areaPoints && (
            <polygon className={fill} points={areaPoints} />
          )}
          <polyline
            className={cn("fill-none", stroke)}
            points={points}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <div className="h-7 w-[72px] rounded-sm bg-muted/40" />
      )}
      <div className={cn("flex min-w-[3.5rem] items-center gap-1 text-xs font-medium", labelColor)}>
        {trend === "up" ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : trend === "down" ? (
          <TrendingDown className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        )}
        <span>
          {percent == null
            ? label
            : `${percent > 0 ? "+" : ""}${percent}%`}
        </span>
      </div>
    </div>
  );
}
