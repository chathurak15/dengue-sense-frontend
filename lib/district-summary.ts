import { SRI_LANKA_RDHS_ZONES } from "@/lib/districts";
import type {
  ReportResponseDTO,
  UserResponseDTO,
  WeeklyCaseRowDTO,
} from "@/lib/types";

export type DistrictTrend = "up" | "down" | "flat";

export interface DistrictSummaryRow {
  rdhsId: number;
  name: string;
  activePhis: number;
  lastWeekCases: number | null;
  weekCases: number[];
  trend: DistrictTrend | null;
  trendPercent: number | null;
  reportCount: number;
}

function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function norm(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function knownZoneName(value: string | null | undefined): string | null {
  const key = norm(value);
  if (!key) return null;
  return SRI_LANKA_RDHS_ZONES.find((z) => norm(z.name) === key)?.name ?? null;
}

/** Prefer RDHS zone when it maps to a known division (e.g. Kalmunai). */
export function zoneNameForCaseRow(row: WeeklyCaseRowDTO): string | null {
  return knownZoneName(row.rdhsZone) ?? knownZoneName(row.districtName);
}

export function trendFromWeeks(weeks: number[]): {
  trend: DistrictTrend | null;
  percent: number | null;
} {
  if (weeks.length < 2) return { trend: null, percent: null };
  const first = weeks[0];
  const last = weeks[weeks.length - 1];
  const trend: DistrictTrend =
    last > first ? "up" : last < first ? "down" : "flat";
  if (first === 0) {
    return { trend, percent: last === 0 ? 0 : null };
  }
  return { trend, percent: Math.round(((last - first) / first) * 100) };
}

export function fourWeeksFromDate(
  lastWeekStartDate: string | null | undefined,
): string | undefined {
  const key = dateKey(lastWeekStartDate);
  if (!key) return undefined;
  const d = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setUTCDate(d.getUTCDate() - 21);
  return d.toISOString().slice(0, 10);
}

export function buildDistrictSummary(args: {
  caseRows: WeeklyCaseRowDTO[];
  lastWeekStartDate: string | null;
  reports: ReportResponseDTO[];
  phis: UserResponseDTO[];
}): DistrictSummaryRow[] {
  const lastWeekKey = dateKey(args.lastWeekStartDate);

  const casesByZone = new Map<string, WeeklyCaseRowDTO[]>();
  for (const row of args.caseRows) {
    const zone = zoneNameForCaseRow(row);
    if (!zone) continue;
    const list = casesByZone.get(zone) ?? [];
    list.push(row);
    casesByZone.set(zone, list);
  }

  const reportsByZone = new Map<string, number>();
  for (const report of args.reports) {
    const zone = knownZoneName(report.districtName);
    if (!zone) continue;
    reportsByZone.set(zone, (reportsByZone.get(zone) ?? 0) + 1);
  }

  const phisByZone = new Map<string, number>();
  for (const phi of args.phis) {
    if (phi.status !== "APPROVED") continue;
    const zone = knownZoneName(phi.districtName);
    if (!zone) continue;
    phisByZone.set(zone, (phisByZone.get(zone) ?? 0) + 1);
  }

  return SRI_LANKA_RDHS_ZONES.map((zone) => {
    const rows = (casesByZone.get(zone.name) ?? []).slice().sort((a, b) => {
      const ak = dateKey(a.weekStartDate) ?? "";
      const bk = dateKey(b.weekStartDate) ?? "";
      return bk.localeCompare(ak);
    });

    const lastWeekRow = lastWeekKey
      ? rows.find((r) => dateKey(r.weekStartDate) === lastWeekKey)
      : rows[0];

    const lastFour = rows.slice(0, 4).reverse();
    const weekCases = lastFour.map((r) => r.weekCases ?? 0);
    const { trend, percent } = trendFromWeeks(weekCases);

    return {
      rdhsId: zone.id,
      name: zone.name,
      activePhis: phisByZone.get(zone.name) ?? 0,
      lastWeekCases:
        lastWeekRow?.weekCases != null ? lastWeekRow.weekCases : null,
      weekCases,
      trend,
      trendPercent: percent,
      reportCount: reportsByZone.get(zone.name) ?? 0,
    };
  }).sort((a, b) => {
    const casesDelta = (b.lastWeekCases ?? -1) - (a.lastWeekCases ?? -1);
    if (casesDelta !== 0) return casesDelta;
    return a.name.localeCompare(b.name);
  });
}
