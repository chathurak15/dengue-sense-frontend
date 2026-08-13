import { create } from "zustand";
import type {
  AlertRow,
  Risk,
  Settings,
  Status,
  User,
  UserResponseDTO,
  RoleType,
  UserStatus,
} from "@/lib/types";

export type { AlertRow, Risk, Settings, Status, User };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toFrontendUser(dto: UserResponseDTO): User {
  const fname = dto.fname ?? "";
  const lname = dto.lname ?? "";
  const name = `${fname} ${lname}`.trim() || dto.email;
  const initials = `${fname[0] ?? ""}${lname[0] ?? dto.email[0] ?? "U"}`
    .slice(0, 2)
    .toUpperCase();
  return {
    id: dto.id,
    fname,
    lname,
    name,
    email: dto.email,
    phoneNumber: dto.phoneNumber,
    initials,
    role: dto.role,
    status: dto.status,
    districtId: dto.districtId ?? null,
    districtName: dto.districtName,
    image: dto.image,
  };
}

const USER_STORAGE_KEY = "ds_user";

function persistUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

function loadStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/** Encode user auth info in a cookie readable by middleware */
function setAuthCookie(role: RoleType, status: UserStatus) {
  document.cookie = `ds_auth=${role}:${status}; path=/; max-age=86400; SameSite=Lax`;
}

function clearAuthCookie() {
  document.cookie = "ds_auth=; path=/; max-age=0; SameSite=Lax";
}

// ─── Store Shape ─────────────────────────────────────────────────────────────

interface AppState {
  user: User | null;
  setUser: (user: User | null) => void;
  hydrateUser: () => void;
  logout: () => void;

  alerts: AlertRow[];
  addReport: (input: {
    loc: string;
    description?: string;
    reporter?: string;
  }) => AlertRow;
  setStatus: (id: string, status: Status) => void;

  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

// ─── Seed Data ───────────────────────────────────────────────────────────────

const seedAlerts: AlertRow[] = [
  {
    id: "RPT-2451",
    loc: "Colombo 07, Cinnamon Gardens",
    reporter: "Citizen #8821",
    risk: "High",
    status: "Pending",
    time: "12 min ago",
    createdAt: Date.now() - 12 * 60_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2450",
    loc: "Dehiwala, Galle Rd",
    reporter: "Citizen #8810",
    risk: "High",
    status: "Pending",
    time: "38 min ago",
    createdAt: Date.now() - 38 * 60_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2449",
    loc: "Kandy, Peradeniya",
    reporter: "PHI J. Silva",
    risk: "Low",
    status: "Dispatched",
    time: "1 hr ago",
    createdAt: Date.now() - 60 * 60_000,
    source: "PHI field",
  },
  {
    id: "RPT-2448",
    loc: "Negombo, Main St",
    reporter: "Citizen #8799",
    risk: "High",
    status: "Dispatched",
    time: "2 hr ago",
    createdAt: Date.now() - 2 * 3_600_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2447",
    loc: "Galle, Fort",
    reporter: "Citizen #8770",
    risk: "Low",
    status: "Resolved",
    time: "3 hr ago",
    createdAt: Date.now() - 3 * 3_600_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2446",
    loc: "Batticaloa, Lake Rd",
    reporter: "PHI R. Kumar",
    risk: "Medium",
    status: "Pending",
    time: "4 hr ago",
    createdAt: Date.now() - 4 * 3_600_000,
    source: "PHI field",
  },
  {
    id: "RPT-2445",
    loc: "Jaffna, Nallur",
    reporter: "Citizen #8744",
    risk: "Medium",
    status: "Resolved",
    time: "6 hr ago",
    createdAt: Date.now() - 6 * 3_600_000,
    source: "Mobile app",
  },
  {
    id: "RPT-2444",
    loc: "Matara, Beach Rd",
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

  setUser: (user) => {
    if (user) {
      setAuthCookie(user.role, user.status);
    }
    persistUser(user);
    set({ user });
  },

  hydrateUser: () => {
    const stored = loadStoredUser();
    if (stored) set({ user: stored });
  },

  logout: () => {
    clearAuthCookie();
    persistUser(null);
    set({ user: null });
  },

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

export { toFrontendUser };
