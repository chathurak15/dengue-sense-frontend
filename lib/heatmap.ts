import type { LandType, ReportResponseDTO, RiskLabel } from "@/lib/types";

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
}

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
  reportId?: number;
}

export const DEMO_CLUSTERS: HeatCluster[] = [
  {
    id: "CL-01",
    name: "Colombo 07, Cinnamon Gardens",
    lat: 6.9106,
    lng: 79.8648,
    risk: "High",
    reports: 18,
    reportIds: [],
    insight:
      "AI model attributes this cluster mostly to discarded containers and stagnant drains following recent rainfall.",
  },
  {
    id: "CL-02",
    name: "Dehiwala, Galle Rd",
    lat: 6.8404,
    lng: 79.8712,
    risk: "High",
    reports: 14,
    reportIds: [],
    insight:
      "High-risk cluster along Galle Road. Multiple HIGH_RISK photos of standing water in construction sites.",
  },
  {
    id: "CL-03",
    name: "Negombo, Main St",
    lat: 7.2083,
    lng: 79.8358,
    risk: "Medium",
    reports: 9,
    reportIds: [],
    insight:
      "AI model attributes this cluster mostly to public drains and discarded containers.",
  },
  {
    id: "CL-04",
    name: "Kandy, Peradeniya",
    lat: 7.2698,
    lng: 80.5966,
    risk: "Medium",
    reports: 7,
    reportIds: [],
    insight:
      "Medium-risk cluster near Peradeniya. Mix of private tanks and garden containers.",
  },
  {
    id: "CL-05",
    name: "Galle, Fort",
    lat: 6.025,
    lng: 80.217,
    risk: "Low",
    reports: 4,
    reportIds: [],
    insight:
      "Low-risk cluster. Continue routine inspection unless new high-risk reports arrive.",
  },
  {
    id: "CL-06",
    name: "Matara, Beach Rd",
    lat: 5.9549,
    lng: 80.555,
    risk: "Low",
    reports: 3,
    reportIds: [],
    insight:
      "Low-risk coastal cluster on public land. Routine PHI walk-through is sufficient.",
  },
  {
    id: "CL-07",
    name: "Jaffna, Nallur",
    lat: 9.674,
    lng: 80.029,
    risk: "Medium",
    reports: 6,
    reportIds: [],
    insight:
      "Medium-risk cluster in Nallur. Reports mostly from private premises after rainfall.",
  },
  {
    id: "CL-08",
    name: "Batticaloa, Lake Rd",
    lat: 7.73,
    lng: 81.692,
    risk: "High",
    reports: 12,
    reportIds: [],
    insight:
      "High-risk cluster near the lagoon. Prioritise PHI dispatch for stagnant water sites.",
  },
];

function isHighRisk(label: RiskLabel | null): boolean {
  return label === "HIGH_RISK";
}

function clusterRisk(high: number, total: number): ClusterRisk {
  if (total === 0) return "Low";
  const ratio = high / total;
  if (ratio >= 0.4 || high >= 3) return "High";
  if (high > 0 || ratio >= 0.2) return "Medium";
  return "Low";
}

function insightFor(reports: ReportResponseDTO[], risk: ClusterRisk): string {
  const landCounts: Record<LandType, number> = {
    PRIVATE: 0,
    PUBLIC: 0,
    UNKNOWN: 0,
  };
  reports.forEach((r) => {
    landCounts[r.landType] += 1;
  });
  const dominant = (Object.entries(landCounts) as [LandType, number][])
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  const landPhrase =
    dominant === "PRIVATE"
      ? "private premises (containers, tanks, and backyard drains)"
      : dominant === "PUBLIC"
        ? "public land (roadside drains and discarded containers)"
        : "mixed private and public sites";

  if (risk === "High") {
    return `AI classification flags a high-risk cluster on ${landPhrase}. Prioritise PHI dispatch after recent rainfall.`;
  }
  if (risk === "Medium") {
    return `AI model attributes this cluster mostly to ${landPhrase}. Monitor and verify remaining reports.`;
  }
  return `Low-risk cluster on ${landPhrase}. Continue routine inspection unless new high-risk reports arrive.`;
}

export function last14Days(reports: ReportResponseDTO[]): ReportResponseDTO[] {
  const cutoff = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const recent = reports.filter(
    (r) => new Date(r.submittedAt).getTime() >= cutoff,
  );
  return recent.length > 0 ? recent : reports;
}

export function buildClusters(reports: ReportResponseDTO[]): HeatCluster[] {
  const cells = new Map<string, ReportResponseDTO[]>();
  for (const report of reports) {
    if (report.latitude == null || report.longitude == null) continue;
    const key = `${(Math.round(report.latitude * 25) / 25).toFixed(2)}_${(
      Math.round(report.longitude * 25) / 25
    ).toFixed(2)}`;
    const list = cells.get(key) ?? [];
    list.push(report);
    cells.set(key, list);
  }

  return Array.from(cells.values())
    .map((group, index) => {
      const lat = group.reduce((s, r) => s + r.latitude, 0) / group.length;
      const lng = group.reduce((s, r) => s + r.longitude, 0) / group.length;
      const high = group.filter((r) => isHighRisk(r.cnnRiskLabel)).length;
      const risk = clusterRisk(high, group.length);
      const district = group[0]?.districtName ?? "Unknown district";
      return {
        id: `CL-${String(index + 1).padStart(2, "0")}`,
        name: `${district}, ${lat.toFixed(3)}, ${lng.toFixed(3)}`,
        lat,
        lng,
        risk,
        reports: group.length,
        reportIds: group.map((r) => r.id),
        insight: insightFor(group, risk),
      } satisfies HeatCluster;
    })
    .sort((a, b) => b.reports - a.reports);
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
  return clusters.flatMap((c) =>
    Array.from({ length: Math.max(1, c.reports) }, (_, i) => {
      const seed = (i + 1) * 17;
      return {
        lat: c.lat + (((seed * 13) % 100) / 100 - 0.5) * 0.012,
        lng: c.lng + (((seed * 29) % 100) / 100 - 0.5) * 0.012,
        intensity: intensity[c.risk],
      };
    }),
  );
}

export function resolveHeatData(reports: ReportResponseDTO[]): {
  clusters: HeatCluster[];
  points: HeatPoint[];
  usingDemo: boolean;
} {
  const recent = last14Days(reports);
  const clusters = buildClusters(recent);
  if (clusters.length === 0) {
    return {
      clusters: DEMO_CLUSTERS,
      points: clustersToHeatPoints(DEMO_CLUSTERS),
      usingDemo: true,
    };
  }
  return {
    clusters,
    points: reportsToHeatPoints(recent),
    usingDemo: false,
  };
}
