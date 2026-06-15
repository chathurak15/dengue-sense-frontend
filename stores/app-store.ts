import { create } from "zustand";
import type { AlertRow, Risk, Settings, Status, User } from "@/lib/types";

// Re-export types for backward-compat imports across the app
export type { AlertRow, Risk, Settings, Status, User };

// ─── Store Shape ─────────────────────────────────────────────────────────────

interface AppState {
  // ── Auth ──────────────────────────────────────────────────────────────────
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (data: {
    name: string;
    email: string;
    badge: string;
    password: string;
  }) => { ok: boolean; error?: string };
  logout: () => void;

  // ── Alerts ────────────────────────────────────────────────────────────────
  alerts: AlertRow[];
  addReport: (input: {
    loc: string;
    description?: string;
    reporter?: string;
  }) => AlertRow;
  setStatus: (id: string, status: Status) => void;

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const seedAlerts: AlertRow[] = [
  {
    id: "RPT-2451",
    loc: "Colombo 07 · Cinnamon Gardens",
    reporter: "Citizen #8821",
    risk: "High",
    status: "Pending",
    time: "12 min ago",
    createdAt: Date.now() - 12 * 60_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2450",
    loc: "Dehiwala · Galle Rd",
    reporter: "Citizen #8810",
    risk: "High",
    status: "Pending",
    time: "38 min ago",
    createdAt: Date.now() - 38 * 60_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2449",
    loc: "Kandy · Peradeniya",
    reporter: "PHI J. Silva",
    risk: "Low",
    status: "Dispatched",
    time: "1 hr ago",
    createdAt: Date.now() - 60 * 60_000,
    source: "PHI field",
  },
  {
    id: "RPT-2448",
    loc: "Negombo · Main St",
    reporter: "Citizen #8799",
    risk: "High",
    status: "Dispatched",
    time: "2 hr ago",
    createdAt: Date.now() - 2 * 3_600_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2447",
    loc: "Galle · Fort",
    reporter: "Citizen #8770",
    risk: "Low",
    status: "Resolved",
    time: "3 hr ago",
    createdAt: Date.now() - 3 * 3_600_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2446",
    loc: "Batticaloa · Lake Rd",
    reporter: "PHI R. Kumar",
    risk: "Medium",
    status: "Pending",
    time: "4 hr ago",
    createdAt: Date.now() - 4 * 3_600_000,
    source: "PHI field",
  },
  {
    id: "RPT-2445",
    loc: "Jaffna · Nallur",
    reporter: "Citizen #8744",
    risk: "Medium",
    status: "Resolved",
    time: "6 hr ago",
    createdAt: Date.now() - 6 * 3_600_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2444",
    loc: "Matara · Beach Rd",
    reporter: "Citizen #8731",
    risk: "Low",
    status: "Resolved",
    time: "8 hr ago",
    createdAt: Date.now() - 8 * 3_600_000,
    source: "Mobile app",
  },
];

const defaultSettings: Settings = {
  notifyHigh: true,
  notifyDigest: true,
  notifySms: false,
  twoFa: true,
  autoDispatch: false,
  riskThreshold: "balanced",
  forecastModel: "lstm-v3",
  mohArea: "cmb",
  language: "en",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Mock risk classification based on keyword heuristics. */
function classifyRisk(text: string): Risk {
  const t = text.toLowerCase();
  if (/(tire|tyre|drain|tank|stagnant|sewer|construction)/.test(t))
    return "High";
  if (/(pot|bucket|bottle|garden|gutter)/.test(t)) return "Medium";
  return Math.random() > 0.5 ? "Medium" : "Low";
}

let counter = 2452;

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  user: null,

  login: (email, password) => {
    if (!email.includes("@") || password.length < 4) {
      return {
        ok: false,
        error: "Enter a valid email and password (min 4 chars).",
      };
    }
    const name = email
      .split("@")[0]
      .replace(/[._]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const initials = name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    set({ user: { name, email, badge: "PHI-2025-0421", initials } });
    return { ok: true };
  },

  register: (data) => {
    if (
      !data.email.includes("@") ||
      data.password.length < 4 ||
      !data.name ||
      !data.badge
    ) {
      return { ok: false, error: "Please fill all fields with valid values." };
    }
    const initials = data.name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    set({
      user: {
        name: data.name,
        email: data.email,
        badge: data.badge,
        initials,
      },
    });
    return { ok: true };
  },

  logout: () => set({ user: null }),

  alerts: seedAlerts,

  addReport: (input) => {
    const id = `RPT-${counter++}`;
    const row: AlertRow = {
      id,
      loc: input.loc,
      reporter:
        input.reporter ??
        `Citizen #${Math.floor(8000 + Math.random() * 999)}`,
      risk: classifyRisk(`${input.loc} ${input.description ?? ""}`),
      status: "Pending",
      time: "just now",
      createdAt: Date.now(),
      source: "Mobile app",
      description: input.description,
    };
    set((s) => ({ alerts: [row, ...s.alerts] }));
    return row;
  },

  setStatus: (id, status) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, status } : a)),
    })),

  settings: defaultSettings,
  updateSettings: (patch) =>
    set((s) => ({ settings: { ...s.settings, ...patch } })),
}));
