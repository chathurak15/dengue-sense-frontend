"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Filter,
  Layers,
  Loader2,
  Locate,
  MapPin,
  Navigation,
  Search,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LiveMapStatus } from "@/components/dashboard/live-map-status";
import { useLiveClusters } from "@/hooks/use-live-clusters";
import { cn } from "@/lib/utils";
import {
  clusterHref,
  heatPointsForClusters,
  toHeatClusters,
  type ClusterRisk,
} from "@/lib/heatmap";

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

type RiskFilter = "all" | "high" | "medium" | "low";

function RiskBadge({ risk }: { risk: ClusterRisk }) {
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

export default function HeatmapPage() {
  const router = useRouter();
  const { clusters: clusterDtos, loading, error } = useLiveClusters();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [query, setQuery] = useState("");
  const [showHeat, setShowHeat] = useState(true);
  const [showMarkers, setShowMarkers] = useState(true);

  const clusters = useMemo(() => toHeatClusters(clusterDtos), [clusterDtos]);

  const visible = useMemo(
    () =>
      clusters.filter((c) => {
        const riskOk =
          riskFilter === "all" || c.risk.toLowerCase() === riskFilter;
        const q = query.trim().toLowerCase();
        const queryOk = q === "" || c.name.toLowerCase().includes(q);
        return riskOk && queryOk;
      }),
    [clusters, riskFilter, query],
  );

  const visiblePoints = useMemo(
    () => heatPointsForClusters(clusterDtos, visible),
    [clusterDtos, visible],
  );

  const selected =
    visible.find((c) => c.id === selectedId) ?? visible[0] ?? null;
  const totalReports = visible.reduce((sum, c) => sum + c.reports, 0);

  const openCluster = (id: string) => {
    const cluster = visible.find((c) => c.id === id);
    if (!cluster) return;
    setSelectedId(id);
    router.push(clusterHref(cluster));
  };

  const dispatchPhi = () => {
    if (!selected) return;
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${selected.lat},${selected.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
    toast.success(`Opening navigation to ${selected.name}`);
  };

  return (
    <DashboardShell title="Spatial Heatmap">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Live Spatial Heatmap
                <LiveMapStatus usingDemo={false} />
              </CardTitle>
              <CardDescription>
                {error
                  ? error
                  : "Detected clusters from the server. Click a cluster for its reports."}
              </CardDescription>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search MOH area…"
                  className="w-full pl-9 sm:w-56"
                />
              </div>
              <Select
                value={riskFilter}
                onValueChange={(v) => setRiskFilter(v as RiskFilter)}
              >
                <SelectTrigger className="w-full sm:w-36">
                  <Filter className="mr-2 h-3.5 w-3.5" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risks</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant={showHeat && showMarkers ? "outline" : "secondary"}
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  if (showHeat && showMarkers) {
                    setShowHeat(false);
                    toast.info("Heat layer hidden");
                    return;
                  }
                  setShowHeat(true);
                  setShowMarkers(true);
                  toast.success("Heat + cluster markers on");
                }}
              >
                <Layers className="h-4 w-4" /> Layers
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="relative h-[55vh] min-h-[280px] overflow-hidden rounded-md border border-border bg-[#0b1220] sm:h-[68vh]">
              {loading && clusters.length === 0 ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading clusters…
                </div>
              ) : (
                <HeatmapMap
                  clusters={visible}
                  points={visiblePoints}
                  selectedId={selected?.id ?? null}
                  showHeat={showHeat}
                  showMarkers={showMarkers}
                  fitKey="live"
                  onSelect={openCluster}
                />
              )}

              <div className="pointer-events-none absolute bottom-3 left-3 z-[500] flex items-center gap-2 rounded-md border border-border bg-background/85 px-3 py-2 text-xs backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {visible.length} clusters, {totalReports} reports
              </div>

              <div className="pointer-events-none absolute right-3 top-3 z-[500] flex flex-col gap-2 rounded-md border border-border bg-background/85 p-2 text-xs backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
                  High
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Medium
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                  Low
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cluster Detail</CardTitle>
            <CardDescription>{selected ? `#${selected.id}` : "No cluster selected"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {visible.length > 0 ? (
              <div className="space-y-1">
                {visible.map((cluster) => {
                  const isActive = selected?.id === cluster.id;
                  return (
                    <button
                      key={cluster.id}
                      type="button"
                      onClick={() => openCluster(cluster.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left transition-colors",
                        isActive
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted/50",
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">
                          #{cluster.id}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {cluster.name}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <RiskBadge risk={cluster.risk} />
                        <span className="tabular-nums text-sm font-semibold">
                          {cluster.reports}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}
            {selected ? (
              <>
                <div>
                  <div className="text-sm text-muted-foreground">Location</div>
                  <div className="font-medium">{selected.name}</div>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Risk</div>
                    <div className="mt-1">
                      <RiskBadge risk={selected.risk} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reports</div>
                    <div className="text-2xl font-semibold">{selected.reports}</div>
                  </div>
                </div>
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  {selected.insight}
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1 gap-1.5" onClick={dispatchPhi}>
                    <Locate className="h-4 w-4" /> Dispatch PHI
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => selected && openCluster(selected.id)}
                  >
                    Open cluster
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  className="w-full gap-1.5 text-muted-foreground"
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${selected.lat},${selected.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="h-4 w-4" /> Open in Google Maps
                  </a>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No clusters in the current filter.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
