import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Locale-stable so SSR and the client never disagree on separators. */
export function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-LK");
}

export function formatIsoDate(value: string | null | undefined): string {
  if (!value) return "—";
  const iso = value.slice(0, 10);
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatIsoWeekRange(
  start: string | null | undefined,
  end?: string | null,
): string {
  if (!start) return "No weekly records yet";
  const from = formatIsoDate(start);
  const to = formatIsoDate(end ?? start);
  return from === to ? from : `${from} – ${to}`;
}
