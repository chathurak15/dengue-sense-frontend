import { rdhsIdFromName } from "@/lib/districts";
import type {
  DistrictForecastResponseDTO,
  User,
  WeeklyCaseRowDTO,
} from "@/lib/types";

function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

/** First Monday after the latest dengue-case week (history ends on that week). */
export function targetWeekAfterLatest(
  lastDengueWeekStart: string | null | undefined,
): string | null {
  const key = dateKey(lastDengueWeekStart);
  if (!key) return null;
  const d = new Date(`${key}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  d.setUTCDate(d.getUTCDate() + 7);
  return d.toISOString().slice(0, 10);
}

export function assignedRdhsId(
  user: Pick<User, "districtName"> | null,
): number | null {
  return rdhsIdFromName(user?.districtName ?? null);
}

/** Only ADMINISTRATOR (ADMIN) may trigger a forecast regenerate. */
export function canTriggerForecast(
  user: User | null,
  rdhsId: number,
): boolean {
  if (!user || !Number.isInteger(rdhsId) || rdhsId < 0) return false;
  return user.role === "ADMIN";
}

/**
 * True when a generated forecast already exists for the coming target week.
 * The backend upserts the same week, so the UI must not fire regenerate.
 */
export function isSameWeekPrediction(
  forecast: DistrictForecastResponseDTO | null,
  targetWeekStart: string | null,
): boolean {
  if (!forecast || !targetWeekStart || forecast.status === "FAILED") return false;
  return dateKey(forecast.targetWeekStart) === dateKey(targetWeekStart);
}

function addUtcWeeks(iso: string, weeks: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
}

function shortWeekLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface HistoryForecastPoint {
  week: string;
  weekDate: string;
  actual: number | null;
  predicted: number | null;
  lower: number | null;
  upper: number | null;
}

/** Sum week_cases by week start (one district or a national rollup). */
export function rollupWeeklyCases(
  rows: WeeklyCaseRowDTO[],
): { weekStartDate: string; weekCases: number }[] {
  const totals = new Map<string, number>();
  for (const row of rows) {
    const key = dateKey(row.weekStartDate);
    if (!key) continue;
    totals.set(key, (totals.get(key) ?? 0) + (row.weekCases ?? 0));
  }
  return [...totals.entries()]
    .map(([weekStartDate, weekCases]) => ({ weekStartDate, weekCases }))
    .sort((a, b) => a.weekStartDate.localeCompare(b.weekStartDate));
}

/**
 * Last N observed weeks plus the 4-week LSTM forecast, with the prediction
 * line anchored on the latest confirmed week so the trend is continuous.
 */
export function buildHistoryForecastSeries(
  rows: WeeklyCaseRowDTO[],
  forecast: DistrictForecastResponseDTO | null,
  historyWeeks = 8,
): HistoryForecastPoint[] {
  const history = rollupWeeklyCases(rows).slice(-historyWeeks);
  const points: HistoryForecastPoint[] = history.map((row) => ({
    week: shortWeekLabel(row.weekStartDate),
    weekDate: row.weekStartDate,
    actual: row.weekCases,
    predicted: null,
    lower: null,
    upper: null,
  }));

  const predictions = forecast?.predictions ?? [];
  if (predictions.length === 0) return points;

  // Overlap the last confirmed week with the forecast series so Recharts can
  // draw a continuous line/CI band into W+1 (otherwise Aug 3–Aug 10 is a hole).
  if (points.length > 0) {
    const last = points[points.length - 1];
    const join = last.actual;
    points[points.length - 1] = {
      ...last,
      predicted: join,
      lower: join,
      upper: join,
    };
  }

  const start =
    dateKey(forecast?.targetWeekStart) ??
    (history.length > 0
      ? addUtcWeeks(history[history.length - 1].weekStartDate, 1)
      : null);

  predictions.forEach((predicted, i) => {
    const weekDate = start ? addUtcWeeks(start, i) : `W+${i + 1}`;
    points.push({
      week: start ? shortWeekLabel(weekDate) : `W+${i + 1}`,
      weekDate,
      actual: null,
      predicted,
      lower: forecast?.lowerBounds?.[i] ?? null,
      upper: forecast?.upperBounds?.[i] ?? null,
    });
  });

  return points;
}
