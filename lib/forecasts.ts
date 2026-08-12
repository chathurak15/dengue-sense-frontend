import { rdhsIdFromName } from "@/lib/districts";
import type { DistrictForecastResponseDTO, User } from "@/lib/types";

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
