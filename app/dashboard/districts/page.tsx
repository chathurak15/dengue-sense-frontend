"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Eye,
  FileText,
  Loader2,
  MapPinned,
  RefreshCw,
  Search,
  Users,
  CalendarRange,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { TrendSparkline } from "@/components/dashboard/trend-sparkline";
import { DistrictForecastDialog } from "@/components/dashboard/district-forecast-dialog";
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
import { useAppStore } from "@/stores/app-store";
import {
  ApiError,
  apiGetAllReports,
  apiGetDengueCaseSummary,
  apiGetUsersByRoleAndStatus,
  apiGetWeeklyCases,
} from "@/lib/api";
import {
  buildDistrictSummary,
  fourWeeksFromDate,
  type DistrictSummaryRow,
} from "@/lib/district-summary";
import { SRI_LANKA_RDHS_ZONES } from "@/lib/districts";
import type {
  DengueCaseSummaryDTO,
  ReportResponseDTO,
  UserResponseDTO,
  WeeklyCaseRowDTO,
} from "@/lib/types";

const USER_PAGE_SIZE = 50;
const CASE_PAGE_SIZE = 150;
const REPORT_PAGE_SIZE = 500;

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

async function fetchAllPages<T>(
  loadPage: (
    page: number,
    size: number,
  ) => Promise<{ content: T[]; totalPages: number; totalItems: number }>,
  size: number,
  maxPages: number,
): Promise<{ items: T[]; totalItems: number }> {
  const first = await loadPage(0, size);
  const items = [...(first.content ?? [])];
  const pages = Math.min(first.totalPages || 1, maxPages);
  if (pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: pages - 1 }, (_, i) => loadPage(i + 1, size)),
    );
    for (const page of rest) items.push(...(page.content ?? []));
  }
  return { items, totalItems: first.totalItems };
}

async function fetchDistrictSummary() {
  const caseSummary = await apiGetDengueCaseSummary().catch(() => null);
  const fromDate = fourWeeksFromDate(caseSummary?.lastWeekStartDate ?? null);

  const [casesResult, reportsResult, phisResult] = await Promise.all([
    fetchAllPages<WeeklyCaseRowDTO>(
      (page, size) => apiGetWeeklyCases(page, size, { fromDate }),
      CASE_PAGE_SIZE,
      4,
    ).catch(() => ({ items: [] as WeeklyCaseRowDTO[], totalItems: 0 })),
    fetchAllPages<ReportResponseDTO>(
      (page, size) => apiGetAllReports(page, size),
      REPORT_PAGE_SIZE,
      6,
    ).catch(() => ({ items: [] as ReportResponseDTO[], totalItems: 0 })),
    fetchAllPages<UserResponseDTO>(
      (page, size) =>
        apiGetUsersByRoleAndStatus("PHI", "APPROVED", page, size),
      USER_PAGE_SIZE,
      10,
    ).catch((err: unknown) => {
      if (err instanceof ApiError && err.status === 403) {
        return { items: [] as UserResponseDTO[], forbidden: true as const };
      }
      return { items: [] as UserResponseDTO[] };
    }),
  ]);

  const phisForbidden = "forbidden" in phisResult && phisResult.forbidden;
  const phis = phisForbidden ? [] : phisResult.items;

  return {
    caseSummary,
    phiAvailable: !phisForbidden,
    reportTotal: reportsResult.totalItems,
    rows: buildDistrictSummary({
      caseRows: casesResult.items,
      lastWeekStartDate: caseSummary?.lastWeekStartDate ?? null,
      reports: reportsResult.items,
      phis,
    }),
  };
}

export default function DistrictsPage() {
  const user = useAppStore((s) => s.user);
  const hydrateUser = useAppStore((s) => s.hydrateUser);
  const canView =
    user?.role === "ADMIN" ||
    user?.role === "MOH" ||
    user?.role === "EPIDEMIOLOGIST";

  const [rows, setRows] = useState<DistrictSummaryRow[]>([]);
  const [summary, setSummary] = useState<DengueCaseSummaryDTO | null>(null);
  const [reportTotal, setReportTotal] = useState(0);
  const [phiAvailable, setPhiAvailable] = useState(true);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [watch, setWatch] = useState<{ id: number; name: string } | null>(null);

  const applySummary = useCallback(
    (data: Awaited<ReturnType<typeof fetchDistrictSummary>>) => {
      setSummary(data.caseSummary);
      setPhiAvailable(data.phiAvailable);
      setReportTotal(data.reportTotal);
      setRows(data.rows);
    },
    [],
  );

  const refreshSummary = async () => {
    setLoading(true);
    try {
      applySummary(await fetchDistrictSummary());
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to load district summary",
      );
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  useEffect(() => {
    if (!canView) return;
    let cancelled = false;
    fetchDistrictSummary()
      .then((data) => {
        if (cancelled) return;
        applySummary(data);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        toast.error(
          err instanceof Error
            ? err.message
            : "Failed to load district summary",
        );
        setRows([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [canView, applySummary]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => row.name.toLowerCase().includes(q));
  }, [rows, query]);

  const totals = useMemo(
    () => ({
      phis: rows.reduce((sum, row) => sum + row.activePhis, 0),
      lastWeek: rows.reduce((sum, row) => sum + (row.lastWeekCases ?? 0), 0),
      reports: rows.reduce((sum, row) => sum + row.reportCount, 0),
      rising: rows.filter((row) => row.trend === "up").length,
    }),
    [rows],
  );

  if (user && !canView) {
    return (
      <DashboardShell title="Districts">
        <Card>
          <CardHeader>
            <CardTitle>National district summary</CardTitle>
            <CardDescription>
              This system-wide view is available to Admin, MOH, and
              Epidemiologist roles.
            </CardDescription>
          </CardHeader>
        </Card>
      </DashboardShell>
    );
  }

  const kpis = [
    {
      label: "RDHS districts",
      value: String(SRI_LANKA_RDHS_ZONES.length),
      delta: "All 26 divisions",
      icon: MapPinned,
    },
    {
      label: "Active PHIs",
      value: phiAvailable ? formatCount(totals.phis) : "—",
      delta: phiAvailable
        ? "Approved officers"
        : "Visible to Admin and MOH",
      icon: Users,
    },
    {
      label: "Last week cases",
      value: formatCount(summary?.lastWeekCases ?? totals.lastWeek),
      delta: summary?.lastWeekStartDate
        ? `${summary.lastWeekStartDate} – ${summary.lastWeekEndDate ?? summary.lastWeekStartDate}`
        : "Latest uploaded week",
      icon: CalendarRange,
    },
    {
      label: "Field reports",
      value: formatCount(reportTotal || totals.reports),
      delta: `${totals.rising} districts rising over 4 weeks`,
      icon: FileText,
    },
  ];

  return (
    <DashboardShell title="Districts">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
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

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPinned className="h-5 w-5 text-primary" />
              District summary
            </CardTitle>
            <CardDescription>
              Active PHIs, last-week cases, 4-week trend, and total reports
              across all RDHS divisions
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search district…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshSummary}
              disabled={loading}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && rows.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading district summary…
              </span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>District</TableHead>
                    <TableHead className="text-right">Active PHIs</TableHead>
                    <TableHead className="text-right">Last week cases</TableHead>
                    <TableHead>4-week trend</TableHead>
                    <TableHead className="text-right">Reports</TableHead>
                    <TableHead className="text-right">Forecast</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.rdhsId}>
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          RDHS #{row.rdhsId}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {phiAvailable ? formatCount(row.activePhis) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCount(row.lastWeekCases)}
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              <TrendSparkline
                                values={row.weekCases}
                                trend={row.trend}
                                percent={row.trendPercent}
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {row.weekCases.length > 0
                              ? `Last ${row.weekCases.length} weeks: ${row.weekCases.join(" → ")}`
                              : "No weekly case records in the last 4 weeks"}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">
                          {formatCount(row.reportCount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() =>
                            setWatch({ id: row.rdhsId, name: row.name })
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Watch
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        {query.trim()
                          ? "No districts match this search."
                          : "No district rows to display."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              </TooltipProvider>
            </div>
          )}
          {!loading && (
            <div className="mt-4 text-xs text-muted-foreground">
              Trend uses each district&apos;s last 4 weekly case records. An up
              trend is shown in red. Rising districts:{" "}
              <Badge variant="outline" className="border-red-500/40 text-red-600 dark:text-red-400">
                {totals.rising}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      <DistrictForecastDialog
        open={watch != null}
        rdhsId={watch?.id ?? null}
        districtName={watch?.name ?? ""}
        onOpenChange={(open) => {
          if (!open) setWatch(null);
        }}
      />
    </DashboardShell>
  );
}
