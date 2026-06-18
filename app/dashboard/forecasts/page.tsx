"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { TrendingUp, AlertTriangle, Brain, CalendarRange } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Dynamic imports — Recharts must NOT run on the server ────────────────────

const ChartLoadingFallback = () => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
    Loading chart…
  </div>
);

const ForecastAreaChart = dynamic(
  () =>
    import("@/components/dashboard/charts/forecast-area-chart").then(
      (m) => m.ForecastAreaChart
    ),
  { ssr: false, loading: ChartLoadingFallback }
);

const DistrictBarChart = dynamic(
  () =>
    import("@/components/dashboard/charts/district-bar-chart").then(
      (m) => m.DistrictBarChart
    ),
  { ssr: false, loading: ChartLoadingFallback }
);

// ─── Static Data ──────────────────────────────────────────────────────────────

const forecastData = [
  { week: "W-6", actual: 145, predicted: null, lower: null, upper: null },
  { week: "W-5", actual: 160, predicted: null, lower: null, upper: null },
  { week: "W-4", actual: 180, predicted: null, lower: null, upper: null },
  { week: "W-3", actual: 210, predicted: null, lower: null, upper: null },
  { week: "W-2", actual: 245, predicted: null, lower: null, upper: null },
  { week: "W-1", actual: 268, predicted: 268, lower: 268, upper: 268 },
  { week: "W+1", actual: null, predicted: 295, lower: 270, upper: 320 },
  { week: "W+2", actual: null, predicted: 332, lower: 295, upper: 370 },
  { week: "W+3", actual: null, predicted: 360, lower: 312, upper: 410 },
  { week: "W+4", actual: null, predicted: 348, lower: 290, upper: 412 },
];

interface District {
  name: string;
  current: number;
  forecast: number;
  change: number;
}

const districts: District[] = [
  { name: "Colombo", current: 268, forecast: 348, change: 30 },
  { name: "Gampaha", current: 154, forecast: 210, change: 36 },
  { name: "Kandy", current: 88, forecast: 92, change: 5 },
  { name: "Galle", current: 64, forecast: 70, change: 9 },
  { name: "Jaffna", current: 51, forecast: 48, change: -6 },
  { name: "Batticaloa", current: 73, forecast: 110, change: 50 },
];

type HorizonValue = "2" | "4" | "8";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ForecastsPage() {
  const [horizon, setHorizon] = useState<HorizonValue>("4");

  const sortedDistricts = [...districts].sort((a, b) => b.change - a.change);

  return (
    <DashboardShell title="Forecasts">
      {/* ── KPI Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Model Accuracy (MAPE)
            </CardTitle>
            <Brain className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">8.4%</div>
            <p className="mt-1 text-xs text-muted-foreground">
              LSTM v3 · evaluated weekly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected Peak
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">W+3</div>
            <p className="mt-1 text-xs text-muted-foreground">
              ~360 confirmed cases nationally
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              High-Risk Districts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">4</div>
            <p className="mt-1 text-xs text-muted-foreground">
              ≥25% surge predicted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── LSTM Forecast Chart ── */}
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>LSTM Outbreak Forecast</CardTitle>
            <CardDescription>
              Confirmed cases with 95% confidence interval
            </CardDescription>
          </div>
          <Select
            value={horizon}
            onValueChange={(v) => setHorizon(v as HorizonValue)}
          >
            <SelectTrigger className="w-40">
              <CalendarRange className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2">Next 2 weeks</SelectItem>
              <SelectItem value="4">Next 4 weeks</SelectItem>
              <SelectItem value="8">Next 8 weeks</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full">
            <ForecastAreaChart data={forecastData} />
          </div>
        </CardContent>
      </Card>

      {/* ── District Analysis ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>District Outlook</CardTitle>
            <CardDescription>
              Current vs forecast 4-week confirmed cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <DistrictBarChart data={districts} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Movers</CardTitle>
            <CardDescription>
              Districts ranked by predicted % change
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rising">
              <TabsList className="mb-4">
                <TabsTrigger value="rising">Rising</TabsTrigger>
                <TabsTrigger value="falling">Falling</TabsTrigger>
              </TabsList>
            </Tabs>
            <ul className="divide-y divide-border">
              {sortedDistricts.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.current} → {d.forecast} cases
                    </div>
                  </div>
                  {d.change >= 25 ? (
                    <Badge variant="destructive">+{d.change}%</Badge>
                  ) : d.change >= 0 ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    >
                      +{d.change}%
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-primary"
                    >
                      {d.change}%
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
