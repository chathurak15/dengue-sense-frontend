"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Send,
  CheckCircle2,
  Eye,
  MapPin,
  Navigation,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Shield,
  AlertTriangle,
  Clock,
  XCircle,
  FileCheck,
  ExternalLink,
  ImageIcon,
  Info,
  Ban,
  ClipboardCheck,
  ZoomIn,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAppStore } from "@/stores/app-store";
import {
  apiGetAllReports,
  apiGetDistrictReports,
  apiUpdateReportStatus,
  apiResolveReport,
  apiGetResolution,
} from "@/lib/api";
import type {
  ReportResponseDTO,
  ReportStatus,
  RiskLabel,
  LandType,
  ResolutionAction,
  ResolutionResponseDTO,
  PaginatedDTO,
} from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

type TabFilter = "all" | "PENDING" | "CLASSIFIED" | "DISPATCHED" | "RESOLVED" | "DISMISSED";

const GOOGLE_MAPS_URL = "https://www.google.com/maps";

function mapsSearchUrl(lat: number, lng: number) {
  return `${GOOGLE_MAPS_URL}/search/?api=1&query=${lat},${lng}`;
}

function mapsDirectionsUrl(lat: number, lng: number) {
  return `${GOOGLE_MAPS_URL}/dir/?api=1&destination=${lat},${lng}`;
}

// ─── Badge Components ────────────────────────────────────────────────────────

function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const styles: Record<ReportStatus, { className: string; label: string }> = {
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
      className: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
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
  const s = styles[status];
  return (
    <Badge variant="outline" className={s.className}>
      {s.label}
    </Badge>
  );
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

function LandTypeBadge({ type }: { type: LandType }) {
  const labels: Record<LandType, string> = {
    PRIVATE: "Private",
    PUBLIC: "Public",
    UNKNOWN: "Unknown",
  };
  return <Badge variant="secondary">{labels[type]}</Badge>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidencePercent(score: number | null): string {
  if (score == null) return "-";
  return `${(score * 100).toFixed(1)}%`;
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 pb-2">
      <span className="shrink-0 text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right text-sm">{value}</span>
    </div>
  );
}

// ─── Resolution Dialog ───────────────────────────────────────────────────────

interface ResolveDialogProps {
  report: ReportResponseDTO | null;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function ResolveDialog({ report, open, onClose, onSuccess }: ResolveDialogProps) {
  const [action, setAction] = useState<ResolutionAction>("TREATED");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!report) return;
    if (notes.trim().length < 1) {
      toast.error("Please add resolution notes");
      return;
    }

    setLoading(true);
    try {
      await apiResolveReport(report.id, { action, notes: notes.trim() });
      toast.success(`Report #${report.id} resolved successfully`);
      setNotes("");
      setAction("TREATED");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            Resolve Report #{report?.id}
          </DialogTitle>
          <DialogDescription>
            Submit resolution evidence for this breeding-site report.
            {report && (
              <span className="mt-1 block text-xs">
                Location: {report.districtName} ({report.latitude.toFixed(5)},{" "}
                {report.longitude.toFixed(5)})
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resolve-action">Resolution Action</Label>
            <Select
              value={action}
              onValueChange={(v) => setAction(v as ResolutionAction)}
            >
              <SelectTrigger id="resolve-action">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TREATED">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Treated: Breeding site eliminated
                  </div>
                </SelectItem>
                <SelectItem value="FALSE_POSITIVE">
                  <div className="flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-500" />
                    False Positive: No breeding site found
                  </div>
                </SelectItem>
                <SelectItem value="NO_ACCESS">
                  <div className="flex items-center gap-2">
                    <Ban className="h-3.5 w-3.5 text-amber-500" />
                    No Access: Could not access location
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="resolve-notes">
              Resolution Notes <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="resolve-notes"
              placeholder="Describe the action taken, observations, chemical used, area covered..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/1000
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={loading} className="gap-1">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Submit Resolution
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Report Detail Dialog ────────────────────────────────────────────────────

interface DetailDialogProps {
  report: ReportResponseDTO | null;
  open: boolean;
  onClose: () => void;
  onDispatch: (r: ReportResponseDTO) => void;
  onOpenResolve: (r: ReportResponseDTO) => void;
}

function ReportDetailDialog({
  report,
  open,
  onClose,
  onDispatch,
  onOpenResolve,
}: DetailDialogProps) {
  const [resolution, setResolution] = useState<ResolutionResponseDTO | null>(null);
  const [loadingResolution, setLoadingResolution] = useState(false);

  useEffect(() => {
    if (!report || report.reportStatus !== "RESOLVED") {
      setResolution(report?.resolution ?? null);
      return;
    }
    if (report.resolution) {
      setResolution(report.resolution);
      return;
    }
    setLoadingResolution(true);
    apiGetResolution(report.id)
      .then(setResolution)
      .catch(() => setResolution(null))
      .finally(() => setLoadingResolution(false));
  }, [report]);

  if (!report) return null;

  const actionLabels: Record<ResolutionAction, string> = {
    TREATED: "Breeding site treated & eliminated",
    FALSE_POSITIVE: "False positive: no breeding site found",
    NO_ACCESS: "Could not access location",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Report #{report.id}
            <ReportStatusBadge status={report.reportStatus} />
          </DialogTitle>
          <DialogDescription>
            {report.districtName ?? "Unknown District"} | Submitted{" "}
            {formatDate(report.submittedAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          {/* Report Image */}
          {report.imageUrl ? (
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="flex items-center gap-2 bg-muted/30 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ImageIcon className="h-3.5 w-3.5" /> Submitted Photo
              </div>
              <a
                href={report.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block"
              >
                <img
                  src={report.imageUrl}
                  alt={`Report #${report.id} breeding site photo`}
                  className="w-full max-h-72 object-cover transition-opacity group-hover:opacity-90"
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                  <div className="flex items-center gap-1.5 rounded-md bg-background/90 px-3 py-1.5 text-sm font-medium shadow-lg">
                    <ZoomIn className="h-4 w-4" /> View full size
                  </div>
                </div>
              </a>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-muted/10 p-6 text-center">
              <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/50" />
              <p className="mt-1 text-xs text-muted-foreground">
                No photo available for this report
              </p>
            </div>
          )}

          {/* Location Section */}
          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> Location
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono text-xs">
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {report.districtName ?? "Unknown"}, {report.landType.toLowerCase()} land
                </p>
              </div>
              <div className="flex gap-1">
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
                          href={mapsSearchUrl(report.latitude, report.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MapPin className="h-3.5 w-3.5" />
                          View
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Open in Google Maps</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1"
                        asChild
                      >
                        <a
                          href={mapsDirectionsUrl(report.latitude, report.longitude)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Navigate
                        </a>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Get directions to location</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <Separator />

          {/* Classification */}
          <DetailRow
            label="AI Risk Classification"
            value={
              <div className="flex items-center gap-2">
                <RiskBadge risk={report.cnnRiskLabel} />
                {report.cnnConfidenceScore != null && (
                  <span className="text-xs text-muted-foreground">
                    ({confidencePercent(report.cnnConfidenceScore)} confidence)
                  </span>
                )}
              </div>
            }
          />
          <DetailRow label="Land Type" value={<LandTypeBadge type={report.landType} />} />
          <DetailRow label="Status" value={<ReportStatusBadge status={report.reportStatus} />} />
          <DetailRow label="Submitted" value={formatDate(report.submittedAt)} />

          {/* Dispatch Info */}
          {report.dispatchedAt && (
            <>
              <Separator />
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <Send className="h-3 w-3" /> Dispatch Details
              </div>
              <DetailRow label="Dispatched At" value={formatDate(report.dispatchedAt)} />
              <DetailRow
                label="Dispatched By"
                value={report.dispatchedByEmail ?? "-"}
              />
            </>
          )}

          {/* Resolution Evidence */}
          {report.reportStatus === "RESOLVED" && (
            <>
              <Separator />
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <FileCheck className="h-3 w-3" /> Resolution Evidence
              </div>
              {loadingResolution ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs text-muted-foreground">
                    Loading resolution details...
                  </span>
                </div>
              ) : resolution ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Action</span>
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      {actionLabels[resolution.action]}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Resolved By</span>
                    <span className="text-sm font-medium">
                      {resolution.resolvedByName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Resolved At</span>
                    <span className="text-sm">{formatDate(resolution.resolvedAt)}</span>
                  </div>
                  {resolution.notes && (
                    <div className="pt-1">
                      <span className="text-xs text-muted-foreground block mb-1">
                        Notes
                      </span>
                      <p className="rounded-md border border-border bg-background p-2 text-sm">
                        {resolution.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-1">
                  No resolution details available.
                </p>
              )}
            </>
          )}

          {/* Notification Status (demo) */}
          {report.reportStatus === "RESOLVED" && (
            <>
              <Separator />
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Citizen Notification
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Push notification sent</p>
                    <p className="text-xs text-muted-foreground">
                      Citizen was notified via FCM when the report was resolved
                      {report.resolvedAt && ` on ${formatDate(report.resolvedAt)}`}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action buttons */}
        <DialogFooter className="gap-2">
          {(report.reportStatus === "PENDING" || report.reportStatus === "CLASSIFIED") && (
            <Button
              className="gap-1"
              onClick={() => {
                onDispatch(report);
                onClose();
              }}
            >
              <Send className="h-3.5 w-3.5" />
              {report.reportStatus === "PENDING" ? "Classify & Dispatch" : "Dispatch PHI"}
            </Button>
          )}
          {report.reportStatus === "DISPATCHED" && (
            <Button
              className="gap-1"
              onClick={() => {
                onOpenResolve(report);
                onClose();
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Resolve
            </Button>
          )}
          <Button variant="outline" asChild>
            <a
              href={mapsDirectionsUrl(report.latitude, report.longitude)}
              target="_blank"
              rel="noopener noreferrer"
              className="gap-1"
            >
              <Navigation className="h-3.5 w-3.5" /> Navigate
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === "ADMIN" || user?.role === "MOH" || user?.role === "EPIDEMIOLOGIST";

  const [reports, setReports] = useState<ReportResponseDTO[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<TabFilter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Dialogs
  const [viewing, setViewing] = useState<ReportResponseDTO | null>(null);
  const [resolving, setResolving] = useState<ReportResponseDTO | null>(null);

  const pageSize = 15;

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      let data: PaginatedDTO<ReportResponseDTO>;

      if (isAdmin) {
        const statusFilter = tab !== "all" ? (tab as ReportStatus) : undefined;
        data = await apiGetAllReports(page, pageSize, {
          status: statusFilter,
        });
      } else {
        data = await apiGetDistrictReports(page, pageSize);
      }

      setReports(data.content);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err) {
      toast.error("Failed to load reports");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, tab, isAdmin]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Client-side filtering by search query and tab (for PHI who gets all district reports)
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (!isAdmin && tab !== "all" && r.reportStatus !== tab) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        String(r.id).includes(q) ||
        (r.districtName?.toLowerCase().includes(q) ?? false) ||
        r.reportStatus.toLowerCase().includes(q)
      );
    });
  }, [reports, tab, query, isAdmin]);

  const counts = useMemo(() => {
    const c = { PENDING: 0, CLASSIFIED: 0, DISPATCHED: 0, RESOLVED: 0, DISMISSED: 0 };
    reports.forEach((r) => {
      if (r.reportStatus in c) c[r.reportStatus as keyof typeof c]++;
    });
    return c;
  }, [reports]);

  // ── Actions ──

  const handleDispatch = async (report: ReportResponseDTO) => {
    setActionLoading(report.id);
    try {
      const targetStatus: ReportStatus =
        report.reportStatus === "PENDING" ? "CLASSIFIED" : "DISPATCHED";
      await apiUpdateReportStatus(report.id, { status: targetStatus });
      toast.success(
        targetStatus === "CLASSIFIED"
          ? `Report #${report.id} classified`
          : `PHI dispatched to report #${report.id}`,
      );
      fetchReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDismiss = async (report: ReportResponseDTO) => {
    setActionLoading(report.id);
    try {
      await apiUpdateReportStatus(report.id, { status: "DISMISSED" });
      toast.success(`Report #${report.id} dismissed`);
      fetchReports();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to dismiss");
    } finally {
      setActionLoading(null);
    }
  };

  const getNextAction = (status: ReportStatus) => {
    switch (status) {
      case "PENDING":
        return { label: "Classify", icon: Shield };
      case "CLASSIFIED":
        return { label: "Dispatch", icon: Send };
      default:
        return null;
    }
  };

  return (
    <DashboardShell title="Reports & Triage">
      {/* ── Summary Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Pending", count: counts.PENDING, icon: Clock, tone: "amber" },
          { label: "Classified", count: counts.CLASSIFIED, icon: Shield, tone: "blue" },
          { label: "Dispatched", count: counts.DISPATCHED, icon: Send, tone: "primary" },
          { label: "Resolved", count: counts.RESOLVED, icon: CheckCircle2, tone: "emerald" },
          { label: "Dismissed", count: counts.DISMISSED, icon: XCircle, tone: "gray" },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-md ${
                  s.tone === "amber"
                    ? "bg-amber-500/10 text-amber-500"
                    : s.tone === "blue"
                      ? "bg-blue-500/10 text-blue-500"
                      : s.tone === "emerald"
                        ? "bg-emerald-500/10 text-emerald-500"
                        : s.tone === "gray"
                          ? "bg-muted text-muted-foreground"
                          : "bg-primary/10 text-primary"
                }`}
              >
                <s.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold tracking-tight">{s.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Reports Table ── */}
      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Field Reports</CardTitle>
            <CardDescription>
              {isAdmin
                ? "All reports across districts. AI-classified breeding sites."
                : "Your district reports. AI-classified breeding sites."}
            </CardDescription>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ID, district..."
                className="w-full pl-9 sm:w-56"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={fetchReports}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs
            value={tab}
            onValueChange={(v) => {
              setTab(v as TabFilter);
              setPage(0);
            }}
            className="mb-4"
          >
            <TabsList className="h-auto w-full flex-wrap justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="CLASSIFIED">Classified</TabsTrigger>
              <TabsTrigger value="DISPATCHED">Dispatched</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
              <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading reports...
              </span>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <FileCheck className="h-10 w-10 mb-2" />
              <p className="text-sm">No reports found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">ID</TableHead>
                      <TableHead className="w-16">Photo</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Land</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReports.map((r) => {
                      const nextAction = getNextAction(r.reportStatus);
                      const isLoading = actionLoading === r.id;
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="font-mono text-xs">
                            #{r.id}
                          </TableCell>
                          <TableCell>
                            {r.imageUrl ? (
                              <a
                                href={r.imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group relative block h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border"
                              >
                                <img
                                  src={r.imageUrl}
                                  alt={`Report #${r.id}`}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                              </a>
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-border bg-muted/30">
                                <ImageIcon className="h-4 w-4 text-muted-foreground/40" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {r.districtName ?? "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs text-muted-foreground">
                                {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={mapsSearchUrl(r.latitude, r.longitude)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex h-5 w-5 items-center justify-center rounded text-primary hover:bg-primary/10"
                                    >
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>Open in Google Maps</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a
                                      href={mapsDirectionsUrl(r.latitude, r.longitude)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex h-5 w-5 items-center justify-center rounded text-primary hover:bg-primary/10"
                                    >
                                      <Navigation className="h-3 w-3" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent>Get directions</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                          <TableCell>
                            <RiskBadge risk={r.cnnRiskLabel} />
                          </TableCell>
                          <TableCell>
                            <LandTypeBadge type={r.landType} />
                          </TableCell>
                          <TableCell>
                            <ReportStatusBadge status={r.reportStatus} />
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  {timeAgo(r.submittedAt)}
                                </TooltipTrigger>
                                <TooltipContent>
                                  {formatDate(r.submittedAt)}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap items-center justify-end gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1"
                                onClick={() => setViewing(r)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">View</span>
                              </Button>

                              {nextAction && (
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  disabled={isLoading}
                                  onClick={() => handleDispatch(r)}
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <nextAction.icon className="h-3.5 w-3.5" />
                                  )}
                                  <span className="hidden xl:inline">
                                    {nextAction.label}
                                  </span>
                                </Button>
                              )}

                              {r.reportStatus === "DISPATCHED" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  disabled={isLoading}
                                  onClick={() => setResolving(r)}
                                >
                                  {isLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  <span className="hidden xl:inline">Resolve</span>
                                </Button>
                              )}

                              {(r.reportStatus === "PENDING" ||
                                r.reportStatus === "CLASSIFIED" ||
                                r.reportStatus === "DISPATCHED") && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
                                        disabled={isLoading}
                                        onClick={() => handleDismiss(r)}
                                      >
                                        <XCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Dismiss report</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages} ({totalItems} total reports)
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="px-3 text-sm text-muted-foreground">
                      {page + 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Dialogs ── */}
      <ReportDetailDialog
        report={viewing}
        open={!!viewing}
        onClose={() => setViewing(null)}
        onDispatch={handleDispatch}
        onOpenResolve={(r) => {
          setViewing(null);
          setResolving(r);
        }}
      />

      <ResolveDialog
        report={resolving}
        open={!!resolving}
        onClose={() => setResolving(null)}
        onSuccess={fetchReports}
      />
    </DashboardShell>
  );
}
