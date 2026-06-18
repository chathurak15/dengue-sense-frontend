"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MapPin, Layers, Filter, Search, Locate } from "lucide-react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ClusterRisk = "High" | "Medium" | "Low";
type RiskFilter = "all" | "high" | "medium" | "low";

interface Cluster {
  id: string;
  name: string;
  top: string;
  left: string;
  size: number;
  risk: ClusterRisk;
  reports: number;
}

// ─── Static Data ──────────────────────────────────────────────────────────────

const clusters: Cluster[] = [
  {
    id: "CL-01",
    name: "Colombo 07 · Cinnamon Gardens",
    top: "22%",
    left: "28%",
    size: 26,
    risk: "High",
    reports: 18,
  },
  {
    id: "CL-02",
    name: "Dehiwala · Galle Rd",
    top: "38%",
    left: "33%",
    size: 22,
    risk: "High",
    reports: 14,
  },
  {
    id: "CL-03",
    name: "Negombo · Main St",
    top: "18%",
    left: "48%",
    size: 18,
    risk: "Medium",
    reports: 9,
  },
  {
    id: "CL-04",
    name: "Kandy · Peradeniya",
    top: "52%",
    left: "62%",
    size: 16,
    risk: "Medium",
    reports: 7,
  },
  {
    id: "CL-05",
    name: "Galle · Fort",
    top: "78%",
    left: "40%",
    size: 12,
    risk: "Low",
    reports: 4,
  },
  {
    id: "CL-06",
    name: "Matara · Beach Rd",
    top: "82%",
    left: "55%",
    size: 10,
    risk: "Low",
    reports: 3,
  },
  {
    id: "CL-07",
    name: "Jaffna · Nallur",
    top: "8%",
    left: "55%",
    size: 14,
    risk: "Medium",
    reports: 6,
  },
  {
    id: "CL-08",
    name: "Batticaloa · Lake Rd",
    top: "45%",
    left: "82%",
    size: 20,
    risk: "High",
    reports: 12,
  },
];

// ─── Sub-Components ───────────────────────────────────────────────────────────

function RiskBadge({ risk }: { risk: ClusterRisk }) {
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
    <Badge
      variant="secondary"
      className="bg-primary/10 text-primary hover:bg-primary/15"
    >
      Low
    </Badge>
  );
}

function clusterDotClass(risk: ClusterRisk, active: boolean): string {
  const base =
    "absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-8 transition-transform hover:scale-110 ";
  const color =
    risk === "High"
      ? "bg-destructive ring-destructive/25" + (risk === "High" ? " animate-pulse" : "")
      : risk === "Medium"
      ? "bg-amber-500 ring-amber-500/25"
      : "bg-primary ring-primary/25";
  const activeRing = active ? " ring-[12px]" : "";
  return base + color + activeRing;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HeatmapPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Cluster>(clusters[0]);
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(
    () =>
      clusters.filter((c) => {
        const riskOk =
          riskFilter === "all" ||
          c.risk.toLowerCase() === riskFilter;
        const queryOk =
          query.trim() === "" ||
          c.name.toLowerCase().includes(query.toLowerCase());
        return riskOk && queryOk;
      }),
    [riskFilter, query]
  );

  const totalReports = visible.reduce((sum, c) => sum + c.reports, 0);

  return (
    <DashboardShell title="Spatial Heatmap">
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        {/* ── Map Panel ── */}
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Live PostGIS Heatmap</CardTitle>
              <CardDescription>
                Spatial clustering of verified reports — last 14 days
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search MOH area…"
                  className="w-56 pl-9"
                />
              </div>
              <Select
                value={riskFilter}
                onValueChange={(v) => setRiskFilter(v as RiskFilter)}
              >
                <SelectTrigger className="w-36">
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
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => toast.info("Layer toggles coming soon")}
              >
                <Layers className="h-4 w-4" /> Layers
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="relative h-[68vh] overflow-hidden rounded-md border border-border bg-muted/20">
              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:32px_32px]" />
              {/* Gradient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,color-mix(in_oklab,var(--color-primary)_18%,transparent),transparent_55%),radial-gradient(circle_at_70%_70%,color-mix(in_oklab,var(--color-destructive)_18%,transparent),transparent_55%)]" />

              {/* Cluster Dots */}
              {visible.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className={clusterDotClass(c.risk, c.id === selected.id)}
                  style={{
                    top: c.top,
                    left: c.left,
                    width: c.size,
                    height: c.size,
                  }}
                  aria-label={c.name}
                />
              ))}

              {/* Bottom Stats Bar */}
              <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-border bg-background/85 px-3 py-2 text-xs backdrop-blur">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                {visible.length} clusters · {totalReports} reports
              </div>

              {/* Legend */}
              <div className="absolute right-3 top-3 flex flex-col gap-2 rounded-md border border-border bg-background/85 p-2 text-xs backdrop-blur">
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

        {/* ── Cluster Detail Panel ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cluster Detail</CardTitle>
            <CardDescription>{selected.id}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Location</div>
              <div className="font-medium">{selected.name}</div>
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
              AI model attributes this cluster mostly to discarded containers
              and stagnant drains following recent rainfall.
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-1.5"
                onClick={() =>
                  toast.success(`PHI dispatched to ${selected.name}`)
                }
              >
                <Locate className="h-4 w-4" /> Dispatch PHI
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => router.push("/dashboard/alerts")}
              >
                View Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
