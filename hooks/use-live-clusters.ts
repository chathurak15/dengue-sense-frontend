"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGetClusters } from "@/lib/api";
import type { ClusterResponseDTO } from "@/lib/types";

const POLL_MS = 20_000;

/**
 * Polls backend report_cluster rows (ACTIVE / ALERTED) for the heatmap.
 */
export function useLiveClusters() {
  const [clusters, setClusters] = useState<ClusterResponseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClusters = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await apiGetClusters();
      setClusters(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      if (!silent) setClusters([]);
      setError(err instanceof Error ? err.message : "Failed to load clusters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
    const id = window.setInterval(() => fetchClusters(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchClusters]);

  return { clusters, loading, error, refetch: fetchClusters };
}
