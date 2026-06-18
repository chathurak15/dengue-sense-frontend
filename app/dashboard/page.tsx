"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Metadata } from "next";
import {
  AlertTriangle,
  FileQuestion,
  CheckCircle2,
  Gauge,
  MapPin,
  Send,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/stores/app-store";
import type { AlertRow, Risk } from "@/lib/types";

// ─── Dynamic import — keeps Recharts OUT of the initial JS bundle ─────────────
const ForecastLineChart = dynamic(
  () =>
    import("@/components/dashboard/charts/forecast-line-chart").then(
      (m) => m.ForecastLineChart
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading chart…
      </div>
    ),
  }
);

// ─── Static chart data ────────────────────────────────────────────────────────

const chartData = [
  { week: "W-8", historical: 120, predicted: null },
  { week: "W-7", historical: 132, predicted: null },
  { week: "W-6", historical: 145, predicted: null },
  { week: "W-5", historical: 160, predicted: null },
  { week: "W-4", historical: 180, predicted: null },
  { week: "W-3", historical: 210, predicted: null },
  { week: "W-2", historical: 245, predicted: null },
  { week: "W-1", historical: 268, predicted: 268 },
  { week: "W+1", historical: null, predicted: 295 },
  { week: "W+2", historical: null, predicted: 332 },
  { week: "W+3", historical: null, predicted: 360 },
  { week: "W+4", historical: null, predicted: 348 },
];

// ─── Stat definition ──────────────────────────────────────────────────────────

type Tone = "destructive" | "muted" | "primary";

interface StatCard {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
}

const baseStats: StatCard[] = [
  {
    label: "Active Alert Clusters",
    value: "12",
    delta: "+3 today",
    icon: AlertTriangle,
    tone: "destructive",
  },
  {
    label: "Unverified Reports",
    value: "47",
    delta: "8 pending review",
    icon: FileQuestion,
    tone: "muted",
  },
  {
    label: "Resolved This Week",
    value: "128",
    delta: "+18% vs last wk",
    icon: CheckCircle2,
    tone: "primary",
  },
  {
    label: "Breeding Site Density",
    value: "0.74",
    delta: "BSDS index",
    icon: Gauge,
    tone: "primary",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function iconClass(tone: Tone): string {
  if (tone === "destructive")
    return "flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive";
  if (tone === "primary")
    return "flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary";
  return "flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground";
}

function RiskBadge({ risk }: { risk: Risk }) {
  if (risk === "High") return <Badge variant="destructive">High</Badge>;
  if (risk === "Medium")
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-600 dark:text-amber-400"
      >
        Medium
      </Badge>
    );
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/15">
      Low
    </Badge>
  );
}

// ─── Map placeholder blobs ────────────────────────────────────────────────────

const mapBlobs = [
  { top: "20%", left: "30%", size: 14, tone: "destructive" as const },
  { top: "35%", left: "55%", size: 22, tone: "destructive" as const },
  { top: "60%", left: "40%", size: 18, tone: "primary" as const },
  { top: "70%", left: "70%", size: 12, tone: "destructive" as const },
  { top: "45%", left: "20%", size: 10, tone: "primary" as const },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const router = useRouter();
  const alerts = useAppStore((s) => s.alerts);
  const setStatus = useAppStore((s) => s.setStatus);

  const recent = useMemo(
    () => alerts.filter((a) => a.status === "Pending").slice(0, 5),
    [alerts]
  );

  const dynamicStats = useMemo<StatCard[]>(() => {
    const pending = alerts.filter((a) => a.status === "Pending").length;
    const resolved = alerts.filter((a) => a.status === "Resolved").length;
    const high = alerts.filter((a) => a.risk === "High").length;

    return baseStats.map((s) => {
      if (s.label === "Active Alert Clusters")
        return { ...s, value: String(high) };
      if (s.label === "Unverified Reports")
        return { ...s, value: String(pending) };
      if (s.label === "Resolved This Week")
        return { ...s, value: String(resolved) };
      return s;
    });
  }, [alerts]);

  const onDispatch = (alert: AlertRow) => {
    setStatus(alert.id, "Dispatched");
    toast.success(`Dispatched PHI to ${alert.loc}`);
  };

  return (
    <DashboardShell title="Dashboard">
      {/* ── KPI Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dynamicStats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className={iconClass(s.tone)}>
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">
                {s.value}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {/* LSTM Forecast Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historical Cases vs 4-Week AI Prediction</CardTitle>
            <CardDescription>
              LSTM forecast — weekly confirmed dengue cases, national rollup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ForecastLineChart data={chartData} />
            </div>
          </CardContent>
        </Card>

        {/* Heatmap Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Live Spatial Heatmap</CardTitle>
            <CardDescription>PostGIS Integration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-80 overflow-hidden rounded-md border border-border bg-[radial-gradient(ellipse_at_top_left,var(--color-primary)/10,transparent_60%),radial-gradient(ellipse_at_bottom_right,var(--color-destructive)/15,transparent_60%)] bg-muted/30">
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:24px_24px]" />
              {mapBlobs.map((p, i) => (
                <span
                  key={i}
                  className={
                    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-4 " +
                    (p.tone === "destructive"
                      ? "bg-destructive/80 ring-destructive/20 animate-pulse"
                      : "bg-primary/80 ring-primary/20")
                  }
                  style={{
                    top: p.top,
                    left: p.left,
                    width: p.size,
                    height: p.size,
                  }}
                />
              ))}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur">
                <MapPin className="h-3 w-3 text-primary" /> 12 clusters · 47
                reports
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Reports Table ── */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Citizen Reports</CardTitle>
            <CardDescription>
              AI-classified, awaiting PHI dispatch
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/alerts")}
          >
            View all
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>AI Risk Level</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.loc}</TableCell>
                  <TableCell>
                    <RiskBadge risk={a.risk} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.time}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="gap-1"
                      onClick={() => onDispatch(a)}
                    >
                      <Send className="h-3.5 w-3.5" /> Dispatch
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {recent.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No pending reports. 🎉
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
