"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, Send, CheckCircle2, Filter, Eye } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/stores/app-store";
import type { AlertRow, Risk, Status } from "@/lib/types";

// ─── Helper Components ────────────────────────────────────────────────────────

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
    <Badge variant="secondary" className="bg-primary/10 text-primary">
      Low
    </Badge>
  );
}

function StatusBadge({ status }: { status: Status }) {
  if (status === "Pending")
    return (
      <Badge
        variant="outline"
        className="border-amber-500/40 text-amber-600 dark:text-amber-400"
      >
        Pending
      </Badge>
    );
  if (status === "Dispatched")
    return (
      <Badge variant="outline" className="border-primary/40 text-primary">
        Dispatched
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-muted-foreground">
      Resolved
    </Badge>
  );
}

function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex items-center justify-between border-b border-border/60 pb-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span>{value}</span>
    </div>
  );
}

// ─── Filter Tabs ──────────────────────────────────────────────────────────────

type TabValue = "all" | "pending" | "dispatched" | "resolved";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const alerts = useAppStore((s) => s.alerts);
  const setStatus = useAppStore((s) => s.setStatus);

  const [tab, setTab] = useState<TabValue>("all");
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<AlertRow | null>(null);

  const rows = useMemo(() => {
    return alerts.filter((r) => {
      const tabOk =
        tab === "all" ||
        (tab === "pending" && r.status === "Pending") ||
        (tab === "dispatched" && r.status === "Dispatched") ||
        (tab === "resolved" && r.status === "Resolved");
      const q = query.trim().toLowerCase();
      const queryOk =
        q === "" ||
        r.loc.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.reporter.toLowerCase().includes(q);
      return tabOk && queryOk;
    });
  }, [alerts, tab, query]);

  const counts = useMemo(
    () => ({
      pending: alerts.filter((d) => d.status === "Pending").length,
      dispatched: alerts.filter((d) => d.status === "Dispatched").length,
      resolved: alerts.filter((d) => d.status === "Resolved").length,
    }),
    [alerts]
  );

  const dispatchOne = (r: AlertRow) => {
    setStatus(r.id, "Dispatched");
    toast.success(`Dispatched PHI to ${r.loc}`);
  };

  const resolveOne = (r: AlertRow) => {
    setStatus(r.id, "Resolved");
    toast.success(`Marked ${r.id} as resolved`);
  };

  return (
    <DashboardShell title="Alerts">
      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{counts.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Field
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{counts.dispatched}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Resolved (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{counts.resolved}</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Alerts Table ── */}
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>All Alerts</CardTitle>
            <CardDescription>
              Citizen and PHI reports classified by the AI risk engine
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search report or location…"
                className="w-64 pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => toast.info("Advanced filters coming soon")}
            >
              <Filter className="h-4 w-4" /> More filters
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as TabValue)}
            className="mb-4"
          >
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="dispatched">Dispatched</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reporter</TableHead>
                <TableHead>Risk</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.id}</TableCell>
                  <TableCell className="font-medium">{r.loc}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {r.reporter}
                    <div className="text-xs">{r.source}</div>
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={r.risk} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {timeAgo(r.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1"
                        onClick={() => setViewing(r)}
                      >
                        <Eye className="h-3.5 w-3.5" /> View
                      </Button>
                      {r.status === "Pending" && (
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => dispatchOne(r)}
                        >
                          <Send className="h-3.5 w-3.5" /> Dispatch
                        </Button>
                      )}
                      {r.status === "Dispatched" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => resolveOne(r)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No matching alerts.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Detail Dialog ── */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report {viewing?.id}</DialogTitle>
            <DialogDescription>{viewing?.loc}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              <DetailRow
                label="Reporter"
                value={`${viewing.reporter} · ${viewing.source}`}
              />
              <DetailRow
                label="AI Risk"
                value={<RiskBadge risk={viewing.risk} />}
              />
              <DetailRow
                label="Status"
                value={<StatusBadge status={viewing.status} />}
              />
              <DetailRow label="Submitted" value={timeAgo(viewing.createdAt)} />
              {viewing.description && (
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Description
                  </div>
                  <p className="mt-1 rounded-md border border-border bg-muted/30 p-3">
                    {viewing.description}
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                {viewing.status === "Pending" && (
                  <Button
                    className="gap-1"
                    onClick={() => {
                      dispatchOne(viewing);
                      setViewing(null);
                    }}
                  >
                    <Send className="h-3.5 w-3.5" /> Dispatch
                  </Button>
                )}
                {viewing.status === "Dispatched" && (
                  <Button
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      resolveOne(viewing);
                      setViewing(null);
                    }}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
