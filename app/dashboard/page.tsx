"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Send,
  Shield,
  Clock,
  ExternalLink,
  Navigation,
  Loader2,
  Eye,
  ArrowRight,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLiveReports } from "@/hooks/use-live-reports";
import { LiveMapStatus } from "@/components/dashboard/live-map-status";
import { DengueCaseKpis } from "@/components/dashboard/dengue-case-kpis";
import { resolveHeatData } from "@/lib/heatmap";
import { apiGetDengueCaseSummary, apiUpdateReportStatus } from "@/lib/api";
import { useAppStore } from "@/stores/app-store";
import type {
  DengueCaseSummaryDTO,
  ReportResponseDTO,
  ReportStatus,
  RiskLabel,
} from "@/lib/types";

const ForecastLineChart = dynamic(
  () =>
    import("@/components/dashboard/charts/forecast-line-chart").then(
      (m) => m.ForecastLineChart,
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

const HeatmapMap = dynamic(
  () =>
    import("@/components/dashboard/heatmap-map").then((m) => m.HeatmapMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Loading map…
      </div>
    ),
  },
);

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

type Tone = "destructive" | "muted" | "primary" | "amber";

function iconClass(tone: Tone): string {
  if (tone === "destructive")
    return "flex h-8 w-8 items-center justify-center rounded-md bg-destructive/10 text-destructive";
  if (tone === "amber")
    return "flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10 text-amber-500";
  if (tone === "primary")
    return "flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary";
  return "flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground";
}

function RiskBadge({ risk }: { risk: RiskLabel | null }) {
  if (!risk || risk === "INVALID")
    return <Badge variant="secondary">Unclassified</Badge>;
  if (risk === "HIGH_RISK")
    return <Badge variant="destructive">High Risk</Badge>;
  return (
    <Badge
      variant="secondary"
      className="bg-primary/10 text-primary hover:bg-primary/15"
    >
      Low Risk
    </Badge>
  );
}

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const map: Record<ReportStatus, { className: string; label: string }> = {
    PENDING: {
      className: "border-amber-500/40 text-amber-600 dark:text-amber-400",
      label: "Pending",
    },
    CLASSIFIED: {
      className: "border-blue-500/40 text-blue-600 dark:text-blue-400",
      label: "Classified",
    },
    DISPATCHED: {
      className: "border-primary/40 text-primary",
      label: "Dispatched",
    },
    RESOLVED: {
      className:
        "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
      label: "Resolved",
    },
    DISMISSED: {
      className: "border-gray-500/40 text-gray-500",
      label: "Dismissed",
    },
    REJECTED: {
      className: "border-red-500/40 text-red-600 dark:text-red-400",
      label: "Rejected",
    },
  };
  const s = map[status];
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
}

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function mapsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

function directionsUrl(lat: number, lng: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardOverviewPage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const { reports, totalItems, loading, refetch, isAdmin } = useLiveReports();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    null,
  );
  const [caseSummary, setCaseSummary] = useState<DengueCaseSummaryDTO | null>(
    null,
  );
  const [caseSummaryLoading, setCaseSummaryLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setCaseSummaryLoading(true);
    apiGetDengueCaseSummary()
      .then((data) => {
        if (!cancelled) setCaseSummary(data);
      })
      .catch(() => {
        if (!cancelled) setCaseSummary(null);
      })
      .finally(() => {
        if (!cancelled) setCaseSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heat = useMemo(() => {
    if (loading && reports.length === 0) {
      return { clusters: [], points: [], usingDemo: false };
    }
    return resolveHeatData(reports);
  }, [reports, loading]);

  const counts = useMemo(() => {
    const c = { pending: 0, dispatched: 0, resolved: 0, highRisk: 0 };
    reports.forEach((r) => {
      if (r.reportStatus === "PENDING" || r.reportStatus === "CLASSIFIED")
        c.pending++;
      if (r.reportStatus === "DISPATCHED") c.dispatched++;
      if (r.reportStatus === "RESOLVED") c.resolved++;
      if (r.cnnRiskLabel === "HIGH_RISK") c.highRisk++;
    });
    return c;
  }, [reports]);

  const recent = useMemo(
    () =>
      reports
        .filter(
          (r) =>
            r.reportStatus === "PENDING" ||
            r.reportStatus === "CLASSIFIED" ||
            r.reportStatus === "DISPATCHED",
        )
        .slice(0, 6),
    [reports],
  );

  const handleAction = async (report: ReportResponseDTO) => {
    const nextStatus: ReportStatus =
      report.reportStatus === "PENDING" ? "CLASSIFIED" : "DISPATCHED";

    setActionLoading(report.id);
    try {
      await apiUpdateReportStatus(report.id, { status: nextStatus });
      toast.success(
        nextStatus === "CLASSIFIED"
          ? `Report #${report.id} classified`
          : `PHI dispatched to report #${report.id}`,
      );
      refetch(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status",
      );
    } finally {
      setActionLoading(null);
    }
  };

  const stats = [
    {
      label: "High-Risk Reports",
      value: String(counts.highRisk),
      delta: `of ${totalItems} total`,
      icon: AlertTriangle,
      tone: "destructive" as Tone,
    },
    {
      label: "Pending Triage",
      value: String(counts.pending),
      delta: "awaiting classification",
      icon: Clock,
      tone: "amber" as Tone,
    },
    {
      label: "Dispatched",
      value: String(counts.dispatched),
      delta: "PHI in field",
      icon: Send,
      tone: "muted" as Tone,
    },
    {
      label: "Resolved",
      value: String(counts.resolved),
      delta: "breeding sites treated",
      icon: CheckCircle2,
      tone: "primary" as Tone,
    },
  ];

  return (
    <DashboardShell title="Dashboard">
      <DengueCaseKpis
        summary={caseSummary}
        loading={caseSummaryLoading}
        districtName={user?.role === "PHI" ? user.districtName : null}
      />
      <div className="mt-2 flex justify-end">
        <Button variant="ghost" size="sm" className="gap-1.5" asChild>
          <Link href="/dashboard/cases">
            View weekly cases
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
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
                {loading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  s.value
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Historical Cases vs 4-Week AI Prediction</CardTitle>
            <CardDescription>
              LSTM forecast for weekly confirmed dengue cases, national rollup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full sm:h-80">
              <ForecastLineChart data={chartData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle>Live Spatial Heatmap</CardTitle>
              <CardDescription>
                Incoming reports on Leaflet and OpenStreetMap. No map API cost.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LiveMapStatus usingDemo={heat.usingDemo} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/dashboard/heatmap")}
              >
                Open map
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative h-56 w-full overflow-hidden rounded-md border border-border bg-[#0b1220] sm:h-72 lg:h-80">
              {loading && heat.clusters.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading map…
                </div>
              ) : (
                <HeatmapMap
                  clusters={heat.clusters}
                  points={heat.points}
                  selectedId={selectedClusterId}
                  showHeat
                  showMarkers
                  compact
                  onSelect={setSelectedClusterId}
                />
              )}
              <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur">
                <MapPin className="h-3 w-3 text-primary" />
                {counts.highRisk} high-risk, {totalItems} reports
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Reports Table ── */}
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Recent Field Reports</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Latest reports across all districts"
                : "Latest reports in your district. AI-classified, awaiting triage"}
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
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading reports...
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">ID</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>AI Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => {
                  const isLoading = actionLoading === r.id;
                  const canAdvance =
                    r.reportStatus === "PENDING" ||
                    r.reportStatus === "CLASSIFIED";

                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">
                        #{r.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {r.districtName ?? "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-xs text-muted-foreground">
                            {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <a
                                  href={mapsUrl(r.latitude, r.longitude)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-5 w-5 items-center justify-center rounded text-primary hover:bg-primary/10"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent>
                                Open in Google Maps
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RiskBadge risk={r.cnnRiskLabel} />
                      </TableCell>
                      <TableCell>
                        <ReportStatusBadge status={r.reportStatus} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {timeAgo(r.submittedAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1">
                          {canAdvance && (
                            <Button
                              size="sm"
                              className="gap-1"
                              disabled={isLoading}
                              onClick={() => handleAction(r)}
                            >
                              {isLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : r.reportStatus === "PENDING" ? (
                                <Shield className="h-3.5 w-3.5" />
                              ) : (
                                <Send className="h-3.5 w-3.5" />
                              )}
                              {r.reportStatus === "PENDING"
                                ? "Classify"
                                : "Dispatch"}
                            </Button>
                          )}
                          {r.reportStatus === "DISPATCHED" && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-1"
                                    asChild
                                  >
                                    <a
                                      href={directionsUrl(
                                        r.latitude,
                                        r.longitude,
                                      )}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Navigation className="h-3.5 w-3.5" />
                                      Navigate
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Get directions to this location
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              router.push("/dashboard/alerts")
                            }
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {recent.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      No active reports in your district.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
