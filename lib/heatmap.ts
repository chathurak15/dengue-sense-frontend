import type { ClusterResponseDTO, ReportResponseDTO, RiskLabel } from "@/lib/types";

export type ClusterRisk = "High" | "Medium" | "Low";

export interface HeatCluster {
  id: string;
  name: string;
  lat: number;
  lng: number;
  risk: ClusterRisk;
  reports: number;
  reportIds: number[];
  insight: string;
  status?: ClusterResponseDTO["status"];
}

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  reportId?: number;
}

export function clusterHref(cluster: Pick<HeatCluster, "id">): string {
  return `/phi/clusters/${cluster.id}`;
}

export function toHeatCluster(dto: ClusterResponseDTO): HeatCluster | null {
  if (dto.latitude == null || dto.longitude == null) return null;
  const risk: ClusterRisk =
    dto.risk === "High" || dto.risk === "Medium" || dto.risk === "Low"
      ? dto.risk
      : "Medium";
  return {
    id: String(dto.id),
    name: `${dto.districtName}, ${dto.latitude.toFixed(3)}, ${dto.longitude.toFixed(3)}`,
    lat: dto.latitude,
    lng: dto.longitude,
    risk,
    reports: dto.reportCount,
    reportIds: dto.reports.map((r) => r.id),
    insight: dto.insight,
    status: dto.status,
  };
}

export function toHeatClusters(dtos: ClusterResponseDTO[]): HeatCluster[] {
  return dtos
    .map(toHeatCluster)
    .filter((c): c is HeatCluster => c != null)
    .sort((a, b) => Number(a.id) - Number(b.id));
}

function intensityFor(label: RiskLabel | null): number {
  if (label === "HIGH_RISK") return 1;
  if (label === "LOW_RISK") return 0.45;
  return 0.28;
}

export function reportsToHeatPoints(reports: ReportResponseDTO[]): HeatPoint[] {
  return reports
    .filter((r) => r.latitude != null && r.longitude != null)
    .map((r) => ({
      lat: r.latitude,
      lng: r.longitude,
      intensity: intensityFor(r.cnnRiskLabel),
      reportId: r.id,
    }));
}

export function clustersToHeatPoints(clusters: HeatCluster[]): HeatPoint[] {
  const intensity: Record<ClusterRisk, number> = {
    High: 0.95,
    Medium: 0.55,
    Low: 0.3,
  };
  return clusters.map((c) => ({
    lat: c.lat,
    lng: c.lng,
    intensity: intensity[c.risk],
  }));
}

export function heatPointsForClusters(
  dtos: ClusterResponseDTO[],
  visible: HeatCluster[],
): HeatPoint[] {
  const ids = new Set(visible.map((c) => c.id));
  const reports = dtos
    .filter((d) => ids.has(String(d.id)))
    .flatMap((d) => d.reports);
  const points = reportsToHeatPoints(reports);
  return points.length > 0 ? points : clustersToHeatPoints(visible);
}
