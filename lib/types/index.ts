// ─── Shared Domain Types ─────────────────────────────────────────────────────

export type Risk = "High" | "Medium" | "Low";
export type Status = "Pending" | "Dispatched" | "Resolved";

export interface AlertRow {
  id: string;
  loc: string;
  reporter: string;
  risk: Risk;
  status: Status;
  /** Human-readable time string (legacy field — prefer createdAt for computed display) */
  time: string;
  createdAt: number;
  source: string;
  description?: string;
}

export interface User {
  name: string;
  email: string;
  badge: string;
  initials: string;
}

export interface Settings {
  notifyHigh: boolean;
  notifyDigest: boolean;
  notifySms: boolean;
  twoFa: boolean;
  autoDispatch: boolean;
  riskThreshold: "sensitive" | "balanced" | "specific";
  forecastModel: "lstm-v3" | "lstm-v2" | "arima";
  mohArea: string;
  language: string;
}
