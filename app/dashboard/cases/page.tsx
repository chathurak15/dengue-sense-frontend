"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DengueCaseKpis } from "@/components/dashboard/dengue-case-kpis";
import { WeeklyCasesUploadCard } from "@/components/dashboard/weekly-cases-upload";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAppStore } from "@/stores/app-store";
import { apiGetDengueCaseSummary, apiGetWeeklyCases } from "@/lib/api";
import { SRI_LANKA_RDHS } from "@/lib/districts";
import type { DengueCaseSummaryDTO, WeeklyCaseRowDTO } from "@/lib/types";

const PAGE_SIZE = 26;
const ALL_RDHS = "all";

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString();
}

export default function WeeklyCasesPage() {
  const user = useAppStore((s) => s.user);
  const isPhi = user?.role === "PHI";
  const canUpload =
    user?.role === "ADMIN" ||
    user?.role === "MOH" ||
    user?.role === "EPIDEMIOLOGIST";

  const [summary, setSummary] = useState<DengueCaseSummaryDTO | null>(null);
  const [rows, setRows] = useState<WeeklyCaseRowDTO[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [district, setDistrict] = useState(ALL_RDHS);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      setSummary(await apiGetDengueCaseSummary());
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load dengue case totals",
      );
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetWeeklyCases(page, PAGE_SIZE, {
        district: isPhi || district === ALL_RDHS ? undefined : district,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      });
      setRows(data.content ?? []);
      setTotalPages(data.totalPages);
      setTotalItems(data.totalItems);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to load weekly cases",
      );
    } finally {
      setLoading(false);
    }
  }, [page, district, fromDate, toDate, isPhi]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const refreshAll = () => {
    fetchSummary();
    fetchRows();
  };

  return (
    <DashboardShell title="Weekly Cases">
      <DengueCaseKpis
        summary={summary}
        loading={summaryLoading}
        districtName={isPhi ? user?.districtName : null}
      />

      {canUpload ? <WeeklyCasesUploadCard onImported={refreshAll} /> : null}

      <Card className="mt-6">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Weekly dengue cases
            </CardTitle>
            <CardDescription>
              {isPhi
                ? `Confirmed cases for ${user?.districtName ?? "your district"}, filterable by week date`
                : "Filter by RDHS (district) and week start date"}
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end lg:w-auto">
            {!isPhi && (
              <div className="space-y-1.5">
                <Label htmlFor="rdhs-filter">RDHS / district</Label>
                <Select
                  value={district}
                  onValueChange={(val) => {
                    setDistrict(val);
                    setPage(0);
                  }}
                >
                  <SelectTrigger id="rdhs-filter" className="w-full sm:w-48">
                    <SelectValue placeholder="All RDHS" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_RDHS}>All 26 RDHS</SelectItem>
                    {SRI_LANKA_RDHS.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="from-date">From week</Label>
              <Input
                id="from-date"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to-date">To week</Label>
              <Input
                id="to-date"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(0);
                }}
                className="w-full sm:w-40"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={refreshAll}
              disabled={loading || summaryLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading || summaryLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading weekly cases...
              </span>
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No weekly case rows match these filters.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>RDHS / district</TableHead>
                      <TableHead>Week start</TableHead>
                      <TableHead>Week end</TableHead>
                      <TableHead className="text-right">Week cases</TableHead>
                      <TableHead className="text-right">
                        Cumulative cases
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium">
                          {row.rdhsZone &&
                          row.rdhsZone.toLowerCase() !==
                            row.districtName.toLowerCase()
                            ? row.rdhsZone
                            : row.districtName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.weekStartDate}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.weekEndDate}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCount(row.weekCases)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCount(row.cumulativeCases)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {totalPages > 1 && (
                <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {page * PAGE_SIZE + 1}-
                    {Math.min((page + 1) * PAGE_SIZE, totalItems)} of{" "}
                    {totalItems} weeks
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
    </DashboardShell>
  );
}
