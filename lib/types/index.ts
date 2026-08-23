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

// ─── Backend Role & Status ───────────────────────────────────────────────────

export type RoleType = "ADMIN" | "EPIDEMIOLOGIST" | "MOH" | "PHI" | "VOLUNTEER";
export type UserStatus = "APPROVED" | "PENDING" | "REJECTED" | "UNAVAILABLE";

// ─── Backend DTOs ────────────────────────────────────────────────────────────

export interface UserResponseDTO {
  id: number;
  fname: string;
  lname: string;
  email: string;
  phoneNumber: string | null;
  status: UserStatus;
  role: RoleType;
  districtId?: number | null;
  districtName: string | null;
  image: string | null;
  createdAt: string;
}

export interface RegisterDTO {
  fname: string;
  lname: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: RoleType;
  districtId: number;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface PaginatedDTO<T = UserResponseDTO> {
  content: T[];
  totalPages: number;
  totalItems: number;
}

// ─── Frontend User (derived from UserResponseDTO) ────────────────────────────

export interface User {
  id: number;
  fname: string;
  lname: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  initials: string;
  role: RoleType;
  status: UserStatus;
  districtId: number | null;
  districtName: string | null;
  image: string | null;
}

export interface UserUpdateDTO {
  email: string;
  fname: string;
  lname: string;
  phoneNumber?: string;
  image?: string;
  districtId: number;
}

// ─── Report Enums ────────────────────────────────────────────────────────────

export type ReportStatus =
  | "PENDING"
  | "CLASSIFIED"
  | "DISPATCHED"
  | "RESOLVED"
  | "DISMISSED"
  | "REJECTED";

export type RiskLabel = "HIGH_RISK" | "LOW_RISK" | "INVALID";
export type LandType = "PRIVATE" | "PUBLIC" | "UNKNOWN";
export type ResolutionAction = "TREATED" | "FALSE_POSITIVE" | "NO_ACCESS";

// ─── Report / Resolution DTOs ────────────────────────────────────────────────

export interface ResolutionResponseDTO {
  id: number;
  reportId: number;
  resolvedByName: string;
  resolvedAt: string;
  action: ResolutionAction;
  notes: string;
}

export interface ReportResponseDTO {
  id: number;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  landType: LandType;
  reportStatus: ReportStatus;
  districtName: string | null;
  cnnRiskLabel: RiskLabel | null;
  cnnConfidenceScore: number | null;
  submittedAt: string;
  dispatchedByEmail: string | null;
  dispatchedAt: string | null;
  resolvedByEmail: string | null;
  resolvedAt: string | null;
  resolvedByDisplayName: string | null;
  resolution: ResolutionResponseDTO | null;
}

export interface ResolutionRequestDTO {
  action: ResolutionAction;
  notes: string;
}

export interface ReportStatusUpdateDTO {
  status: ReportStatus;
}

export interface CsvImportResultDTO {
  imported: number;
  updated: number;
  skipped: number;
  totalRows: number;
  weatherImported?: number;
  bsdsImported?: number;
  errors: string[];
}

export interface WeeklyCaseRowDTO {
  id: number;
  districtId: number;
  districtName: string;
  rdhsZone: string | null;
  weekStartDate: string;
  weekEndDate: string;
  weekCases: number | null;
  cumulativeCases: number | null;
}

export interface DengueCaseSummaryDTO {
  lastWeekStartDate: string | null;
  lastWeekEndDate: string | null;
  lastWeekRdhsCount: number;
  lastWeekRdhsExpected: number;
  lastWeekCases: number;
  lastWeekCumulativeTotal: number;
  year: number;
  nationalYearCases: number;
  scopedToDistrict: boolean;
  districtId: number | null;
  districtName: string | null;
  districtYearCumulative: number | null;
  districtYearCases: number | null;
  districtLastWeekCases: number | null;
}

/** GET /api/v1/public/outbreak-summary — no authentication. */
export interface CitizenOutbreakSummaryDTO {
  weekStartDate: string | null;
  weekEndDate: string | null;
  year: number;
  lastWeekCases: number;
  previousWeekCases: number;
  weekChangePercent: number | null;
  yearCases: number;
  hotspotCount: number;
  nationalRisk: "HIGH" | "MEDIUM" | "LOW" | string;
  banner: string | null;
  highDistricts: string[];
}

// ─── LSTM Predictions ────────────────────────────────────────────────────────

/** A single point on the forecast series (historical or predicted week). */
export interface PredictionPointDTO {
  /** Short axis label, e.g. "W-2", "W+1". */
  label: string;
  weekStartDate: string;
  weekEndDate: string;
  /** Confirmed cases for a historical week; null for future weeks. */
  actualCases: number | null;
  /** Model output for a forecast week; null for past-only weeks. */
  predictedCases: number | null;
  /** 95% confidence interval bounds; null when not applicable. */
  lowerBound: number | null;
  upperBound: number | null;
}

/** Per-district current vs forecast outlook (optional, national runs may omit). */
export interface PredictionDistrictOutlookDTO {
  districtId: number;
  districtName: string;
  currentCases: number;
  forecastCases: number;
  changePercent: number;
}

/** A completed LSTM prediction run stored on the backend. */
export interface PredictionRecordDTO {
  id: number;
  model: string;
  districtId: number | null;
  districtName: string | null;
  /** The latest dengue-case week this run was generated from. */
  basedOnWeekStartDate: string | null;
  basedOnWeekEndDate: string | null;
  horizonWeeks: number;
  generatedAt: string;
  /** Mean absolute percentage error of the model, if evaluated. */
  mape: number | null;
  points: PredictionPointDTO[];
  districtOutlook?: PredictionDistrictOutlookDTO[];
}

export interface PredictionRunRequestDTO {
  horizonWeeks?: number;
  districtId?: number;
}

export type ForecastStatus = "GENERATED" | "STALE" | "FAILED";
export type GenerationSource = "SCHEDULED" | "MANUAL";

/** Persisted RDHS LSTM forecast from GET/POST /api/v1/.../forecasts. */
export interface DistrictForecastResponseDTO {
  rdhsId: number;
  districtName: string;
  targetWeekStart: string;
  predictions: number[];
  lowerBounds: number[] | null;
  upperBounds: number[] | null;
  modelVersion: string;
  status: ForecastStatus;
  generationSource: GenerationSource;
  generatedAt: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

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
