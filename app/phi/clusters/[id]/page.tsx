"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  ImageIcon,
  Loader2,
  Locate,
  MapPin,
  Navigation,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LiveMapStatus } from "@/components/dashboard/live-map-status";
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
import { ApiError, apiGetClusterById } from "@/lib/api";
import {
  reportsToHeatPoints,
  toHeatCluster,
  type ClusterRisk,
} from "@/lib/heatmap";
import type {
  ClusterResponseDTO,
  LandType,
  ReportStatus,
  RiskLabel,
} from "@/lib/types";

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

function ClusterRiskBadge({ risk }: { risk: ClusterRisk }) {
  if (risk === "High") return <Badge variant="destructive">High</Badge>;
  if (risk === "Medium") {
    return (
      <Badge
        variant="secondary"
        className="bg-amber-500/15 text-amber-600 dark:text-amber-400"
      >
        Medium
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary">
      Low
    </Badge>
  );
}

function ReportRiskBadge({ risk }: { risk: RiskLabel | null }) {
  if (!risk || risk === "INVALID") {
    return <Badge variant="secondary">Unclassified</Badge>;
  }
  if (risk === "HIGH_RISK") {
    return <Badge variant="destructive">High Risk</Badge>;
  }
  return (
    <Badge variant="secondary" className="bg-primary/10 text-primary">
      Low Risk
    </Badge>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, string> = {
    PENDING: "border-amber-500/40 text-amber-600 dark:text-amber-400",
    CLASSIFIED: "border-blue-500/40 text-blue-600 dark:text-blue-400",
    DISPATCHED: "border-primary/40 text-primary",
    RESOLVED: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
    DISMISSED: "border-gray-500/40 text-gray-500",
    REJECTED: "border-red-500/40 text-red-600 dark:text-red-400",
  };
  const labels: Record<ReportStatus, string> = {
    PENDING: "Pending",
    CLASSIFIED: "Classified",
    DISPATCHED: "Dispatched",
    RESOLVED: "Resolved",
    DISMISSED: "Dismissed",
    REJECTED: "Rejected",
  };
  return (
    <Badge variant="outline" className={styles[status]}>
      {labels[status]}
    </Badge>
  );
}

function landLabel(type: LandType): string {
  if (type === "PRIVATE") return "Private";
  if (type === "PUBLIC") return "Public";
  return "Unknown";
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("en-LK", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClusterDetailPage() {
  const params = useParams<{ id: string }>();
  const clusterId = Number.parseInt(params.id, 10);

  const [dto, setDto] = useState<ClusterResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(clusterId) || clusterId < 1) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    apiGetClusterById(clusterId)
      .then((data) => {
        if (!cancelled) setDto(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          setDto(null);
          return;
        }
        toast.error(err instanceof Error ? err.message : "Failed to load cluster");
        setNotFound(true);
        setDto(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [clusterId]);

  const cluster = dto ? toHeatCluster(dto) : null;
  const clusterReports = dto?.reports ?? [];
  const mapPoints = useMemo(() => {
    const fromReports = reportsToHeatPoints(clusterReports);
    if (fromReports.length > 0) return fromReports;
    if (!cluster) return [];
    return [{ lat: cluster.lat, lng: cluster.lng, intensity: 0.9 }];
  }, [cluster, clusterReports]);

  const dispatchPhi = () => {
    if (!cluster) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${cluster.lat},${cluster.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
    toast.success(`Opening navigation to ${cluster.name}`);
  };

  if (loading) {
    return (
      <DashboardShell title="Cluster">
        <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading cluster…
        </div>
      </DashboardShell>
    );
  }

  if (notFound || !dto || !cluster) {
    return (
      <DashboardShell title="Cluster">
        <Card>
          <CardHeader>
            <CardTitle>Cluster not found</CardTitle>
            <CardDescription>
              No cluster with this id exists in the database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/dashboard/heatmap">
                <ArrowLeft className="h-4 w-4" />
                Back to heatmap
              </Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={`Cluster ${dto.id}`}>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 px-0">
          <Link href="/dashboard/heatmap">
            <ArrowLeft className="h-4 w-4" />
            Back to heatmap
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center gap-2">
              Cluster map
              <LiveMapStatus usingDemo={false} />
            </CardTitle>
            <CardDescription>
              {dto.reportCount} reports in cluster #{dto.id} ({dto.status}).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative h-[45vh] min-h-[240px] overflow-hidden rounded-md border border-border bg-[#0b1220] sm:h-[56vh]">
              <HeatmapMap
                clusters={[cluster]}
                points={mapPoints}
                selectedId={cluster.id}
                showHeat
                showMarkers
                fitKey={cluster.id}
                maxFitZoom={15}
                onSelect={() => undefined}
              />
              <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-md border border-border bg-background/85 px-3 py-2 text-xs backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                #{dto.id} · {dto.reportCount} reports
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cluster information</CardTitle>
            <CardDescription>ID {dto.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium">{cluster.name}</div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {cluster.lat.toFixed(5)}, {cluster.lng.toFixed(5)}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">Risk</div>
                <div className="mt-1">
                  <ClusterRiskBadge risk={cluster.risk} />
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Reports</div>
                <div className="text-2xl font-semibold">{dto.reportCount}</div>
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              {dto.insight}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="flex-1 gap-1.5" onClick={dispatchPhi}>
                <Locate className="h-4 w-4" /> Dispatch PHI
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/dashboard/alerts">View all reports</Link>
              </Button>
            </div>
            <Button
              variant="ghost"
              className="w-full gap-1.5 text-muted-foreground"
              asChild
            >
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${cluster.lat},${cluster.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Navigation className="h-4 w-4" /> Open in Google Maps
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Reports in this cluster</CardTitle>
          <CardDescription>
            {clusterReports.length > 0
              ? `${clusterReports.length} field reports in cluster #${dto.id}.`
              : "No linked reports for this cluster."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusterReports.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              This cluster has no membership rows yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Land</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Map</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clusterReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-mono text-xs">
                      #{report.id}
                    </TableCell>
                    <TableCell>
                      {report.imageUrl ? (
                        <a
                          href={report.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-10 w-10 overflow-hidden rounded-md border border-border"
                        >
                          <img
                            src={report.imageUrl}
                            alt={`Report #${report.id}`}
                            className="h-full w-full object-cover"
                          />
                        </a>
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
                          <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <ReportRiskBadge risk={report.cnnRiskLabel} />
                    </TableCell>
                    <TableCell>{landLabel(report.landType)}</TableCell>
                    <TableCell>
                      <StatusBadge status={report.reportStatus} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {formatWhen(report.submittedAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1" asChild>
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${report.latitude},${report.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Open
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
