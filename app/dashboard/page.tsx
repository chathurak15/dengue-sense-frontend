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
  Brain,
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
import { useLiveClusters } from "@/hooks/use-live-clusters";
import { useLiveReports } from "@/hooks/use-live-reports";
import { LiveMapStatus } from "@/components/dashboard/live-map-status";
import { DengueCaseKpis } from "@/components/dashboard/dengue-case-kpis";
import {
  clusterHref,
  heatPointsForClusters,
  toHeatClusters,
} from "@/lib/heatmap";
import {
  apiGetDengueCaseSummary,
  apiGetLatestForecast,
  apiGetWeeklyCases,
  apiUpdateReportStatus,
} from "@/lib/api";
import { useAppStore } from "@/stores/app-store";
import {
  assignedRdhsId,
  buildHistoryForecastSeries,
} from "@/lib/forecasts";
import type {
  DengueCaseSummaryDTO,
  DistrictForecastResponseDTO,
  ReportResponseDTO,
  ReportStatus,
  RiskLabel,
  WeeklyCaseRowDTO,
} from "@/lib/types";

const ChartLoadingFallback = () => (
  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
    Loading chart…
  </div>
);

const ForecastAreaChart = dynamic(
  () =>
    import("@/components/dashboard/charts/forecast-area-chart").then(
      (m) => m.ForecastAreaChart,
    ),
  {
    ssr: false,
    loading: ChartLoadingFallback,
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
  const { clusters: clusterDtos, loading: clustersLoading } = useLiveClusters();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(
    null,
  );
  const [caseSummary, setCaseSummary] = useState<DengueCaseSummaryDTO | null>(
    null,
  );
  const [caseSummaryLoading, setCaseSummaryLoading] = useState(true);
  const [trendRows, setTrendRows] = useState<WeeklyCaseRowDTO[]>([]);
  const [trendForecast, setTrendForecast] =
    useState<DistrictForecastResponseDTO | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const rdhsId = assignedRdhsId(user);
  const districtLabel =
    user?.role === "PHI" ? user.districtName : user?.districtName ?? null;
  const scopedToDistrict = user?.role === "PHI" || Boolean(user?.districtName);

  useEffect(() => {
    let cancelled = false;
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

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const isPhi = user.role === "PHI";
    const districtFilter =
      !isPhi && user.districtName ? user.districtName : undefined;
    const assignedId = assignedRdhsId(user);
    const fromDate =
      isPhi || districtFilter
        ? undefined
        : new Date(Date.now() - 9 * 7 * 24 * 60 * 60 * 1000)
            .toISOString()
            .slice(0, 10);

    Promise.all([
      apiGetWeeklyCases(0, isPhi || districtFilter ? 12 : 260, {
        district: districtFilter,
        fromDate,
      }).catch(() => null),
      assignedId != null
        ? apiGetLatestForecast(assignedId).catch(() => null)
        : Promise.resolve(null),
    ]).then(([cases, forecast]) => {
      if (cancelled) return;
      setTrendRows(cases?.content ?? []);
      setTrendForecast(forecast);
      setTrendLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const trendData = useMemo(
    () => buildHistoryForecastSeries(trendRows, trendForecast, 8),
    [trendRows, trendForecast],
  );

  const hasTrend = trendData.length > 0;

  const heatClusters = useMemo(
    () => toHeatClusters(clusterDtos),
    [clusterDtos],
  );
  const heatPoints = useMemo(
    () => heatPointsForClusters(clusterDtos, heatClusters),
    [clusterDtos, heatClusters],
  );

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
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Historical Cases vs 4-Week AI Prediction
              </CardTitle>
              <CardDescription>
                {scopedToDistrict && districtLabel
                  ? `Last 8 weeks of confirmed dengue in ${districtLabel}, plus the coming 4-week LSTM forecast`
                  : "Last 8 weeks of confirmed dengue (national rollup), plus the coming 4-week LSTM forecast"}
              </CardDescription>
            </div>
            {rdhsId != null && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/forecasts/${rdhsId}`}>
                  Open forecast
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full sm:h-80">
              {trendLoading ? (
                <ChartLoadingFallback />
              ) : hasTrend ? (
                <ForecastAreaChart data={trendData} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                  <Brain className="h-8 w-8" />
                  <p>
                    No weekly dengue records yet
                    {districtLabel ? ` for ${districtLabel}` : ""}.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="min-w-0">
              <CardTitle>Live Spatial Heatmap</CardTitle>
              <CardDescription>
                Detected clusters from the server.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <LiveMapStatus usingDemo={false} />
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
              {clustersLoading && heatClusters.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading map…
                </div>
              ) : (
                <HeatmapMap
                  clusters={heatClusters}
                  points={heatPoints}
                  selectedId={selectedClusterId}
                  showHeat
                  showMarkers
                  compact
                  onSelect={(id) => {
                    setSelectedClusterId(id);
                    const cluster = heatClusters.find((c) => c.id === id);
                    if (cluster) router.push(clusterHref(cluster));
                  }}
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
