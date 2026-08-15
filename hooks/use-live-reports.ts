"use client";

import { useCallback, useEffect, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { apiGetAllReports, apiGetDistrictReports } from "@/lib/api";
import type { ReportResponseDTO } from "@/lib/types";

const POLL_MS = 20_000;
const PAGE_SIZE = 500;

/**
 * Polls incoming field reports so the spatial heatmap stays live.
 * Subsequent ticks are silent so the Leaflet map is not remounted.
 */
export function useLiveReports() {
  const user = useAppStore((s) => s.user);
  const isAdmin =
    user?.role === "ADMIN" ||
    user?.role === "MOH" ||
    user?.role === "EPIDEMIOLOGIST";

  const [reports, setReports] = useState<ReportResponseDTO[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const fetchReports = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = isAdmin
          ? await apiGetAllReports(0, PAGE_SIZE)
          : await apiGetDistrictReports(0, PAGE_SIZE);
        setReports(data.content ?? []);
        setTotalItems(data.totalItems);
        setUpdatedAt(Date.now());
      } catch {
        if (!silent) setReports([]);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin],
  );

  useEffect(() => {
    fetchReports();
    const id = window.setInterval(() => fetchReports(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchReports]);

  return {
    reports,
    totalItems,
    loading,
    updatedAt,
    refetch: fetchReports,
    isAdmin,
  };
}
