import type {
  LoginDTO,
  RegisterDTO,
  UserResponseDTO,
  PaginatedDTO,
  ReportResponseDTO,
  ReportStatus,
  LandType,
  ReportStatusUpdateDTO,
  ResolutionRequestDTO,
  ResolutionResponseDTO,
  UserUpdateDTO,
  TelegramAlertStatusDTO,
  CsvImportResultDTO,
  DengueCaseSummaryDTO,
  CitizenOutbreakSummaryDTO,
  WeeklyCaseRowDTO,
  PredictionRecordDTO,
  PredictionRunRequestDTO,
  DistrictForecastResponseDTO,
  ClusterResponseDTO,
} from "@/lib/types";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function parseApiErrorMessage(status: number, text: string): string {
  if (!text) return `Request failed (${status})`;
  try {
    const parsed = JSON.parse(text) as { message?: unknown; error?: unknown };
    if (typeof parsed.message === "string" && parsed.message.trim()) {
      return parsed.message;
    }
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    // not JSON
  }
  return text;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(endpoint, {
    ...options,
    credentials: "include",
    headers,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, parseApiErrorMessage(res.status, text));
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return res.text() as unknown as T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function apiLogin(dto: LoginDTO): Promise<UserResponseDTO> {
  return request<UserResponseDTO>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function apiRegister(dto: RegisterDTO): Promise<string> {
  return request<string>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function apiLogout(): Promise<void> {
  await request<void>("/api/v1/auth/logout", { method: "POST" });
}

// ─── User Management ────────────────────────────────────────────────────────

export async function apiGetAllUsers(
  page = 0,
  size = 10,
): Promise<PaginatedDTO> {
  return request<PaginatedDTO>(
    `/api/v1/user/all?page=${page}&size=${size}`,
  );
}

export async function apiGetPHIUsers(
  page = 0,
  size = 20,
): Promise<PaginatedDTO> {
  return request<PaginatedDTO>(
    `/api/v1/user/phi?page=${page}&size=${size}`,
  );
}

export async function apiGetUsersByRoleAndStatus(
  role: string,
  status: string,
  page = 0,
  size = 20,
): Promise<PaginatedDTO> {
  return request<PaginatedDTO>(
    `/api/v1/user/by-role-status?role=${role}&status=${status}&page=${page}&size=${size}`,
  );
}

export async function apiUpdateUserStatus(
  id: number,
  status: string,
): Promise<string> {
  return request<string>(
    `/api/v1/user/status?id=${id}&status=${status}`,
    { method: "PUT" },
  );
}

export async function apiDeleteUser(id: number): Promise<string> {
  return request<string>(`/api/v1/user/${id}`, { method: "DELETE" });
}

export async function apiUpdateUser(dto: UserUpdateDTO): Promise<string> {
  return request<string>("/api/v1/user/update", {
    method: "PUT",
    body: JSON.stringify(dto),
  });
}

export async function apiGetTelegramAlerts(): Promise<TelegramAlertStatusDTO> {
  return request<TelegramAlertStatusDTO>("/api/v1/user/telegram-alerts");
}

export async function apiSyncTelegramAlerts(): Promise<TelegramAlertStatusDTO> {
  return request<TelegramAlertStatusDTO>("/api/v1/user/telegram-alerts/sync", {
    method: "POST",
  });
}

// ─── Reports ────────────────────────────────────────────────────────────────

export async function apiGetAllReports(
  page = 0,
  size = 20,
  filters?: {
    status?: ReportStatus;
    districtId?: number;
    landType?: LandType;
  },
): Promise<PaginatedDTO<ReportResponseDTO>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: "submittedAt,desc",
  });
  if (filters?.status) params.set("status", filters.status);
  if (filters?.districtId) params.set("districtId", String(filters.districtId));
  if (filters?.landType) params.set("landType", filters.landType);

  return request<PaginatedDTO<ReportResponseDTO>>(
    `/api/v1/reports/all?${params}`,
  );
}

export async function apiGetDistrictReports(
  page = 0,
  size = 20,
): Promise<PaginatedDTO<ReportResponseDTO>> {
  return request<PaginatedDTO<ReportResponseDTO>>(
    `/api/v1/reports/phi/district?page=${page}&size=${size}&sort=submittedAt,desc`,
  );
}

export async function apiGetDistrictResolvedReports(
  page = 0,
  size = 20,
): Promise<PaginatedDTO<ReportResponseDTO>> {
  return request<PaginatedDTO<ReportResponseDTO>>(
    `/api/v1/reports/phi/district/resolved?page=${page}&size=${size}&sort=submittedAt,desc`,
  );
}

export async function apiGetMyResolvedReports(
  page = 0,
  size = 20,
): Promise<PaginatedDTO<ReportResponseDTO>> {
  return request<PaginatedDTO<ReportResponseDTO>>(
    `/api/v1/reports/phi/my-resolved?page=${page}&size=${size}&sort=submittedAt,desc`,
  );
}

export async function apiGetReportById(
  id: number,
): Promise<ReportResponseDTO> {
  return request<ReportResponseDTO>(`/api/v1/reports/${id}`);
}

export async function apiUpdateReportStatus(
  id: number,
  dto: ReportStatusUpdateDTO,
): Promise<ReportResponseDTO> {
  return request<ReportResponseDTO>(`/api/v1/reports/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(dto),
  });
}

// ─── Resolutions ────────────────────────────────────────────────────────────

export async function apiResolveReport(
  reportId: number,
  dto: ResolutionRequestDTO,
): Promise<ResolutionResponseDTO> {
  return request<ResolutionResponseDTO>(
    `/api/v1/resolutions/${reportId}`,
    {
      method: "POST",
      body: JSON.stringify(dto),
    },
  );
}

export async function apiGetResolution(
  reportId: number,
): Promise<ResolutionResponseDTO> {
  return request<ResolutionResponseDTO>(
    `/api/v1/resolutions/${reportId}`,
  );
}

// ─── Weekly dengue cases ─────────────────────────────────────────────────────

export async function apiUploadWeeklyCasesCsv(
  file: File,
): Promise<CsvImportResultDTO> {
  const body = new FormData();
  body.append("file", file);
  return request<CsvImportResultDTO>("/api/v1/admin/cases/csv", {
    method: "POST",
    body,
  });
}

export async function apiGetWeeklyCases(
  page = 0,
  size = 26,
  filters?: {
    district?: string;
    districtId?: number;
    fromDate?: string;
    toDate?: string;
  },
): Promise<PaginatedDTO<WeeklyCaseRowDTO>> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    sort: "weekStartDate,desc",
  });
  if (filters?.district) params.set("district", filters.district);
  if (filters?.districtId) params.set("districtId", String(filters.districtId));
  if (filters?.fromDate) params.set("fromDate", filters.fromDate);
  if (filters?.toDate) params.set("toDate", filters.toDate);

  return request<PaginatedDTO<WeeklyCaseRowDTO>>(`/api/v1/cases?${params}`);
}

export async function apiGetDengueCaseSummary(
  districtId?: number,
): Promise<DengueCaseSummaryDTO> {
  const params = new URLSearchParams();
  if (districtId) params.set("districtId", String(districtId));
  const qs = params.toString();
  return request<DengueCaseSummaryDTO>(
    `/api/v1/cases/summary${qs ? `?${qs}` : ""}`,
  );
}

function publicApiUrl(path: string): string {
  if (typeof window === "undefined") {
    const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return `${base}${path}`;
  }
  return path;
}

/** National snapshot for the landing page. Public — no session required. */
export async function apiGetPublicOutbreakSummary(): Promise<CitizenOutbreakSummaryDTO> {
  return request<CitizenOutbreakSummaryDTO>(
    publicApiUrl("/api/v1/public/outbreak-summary"),
    { next: { revalidate: 120 } } as RequestInit,
  );
}

// ─── LSTM Predictions ────────────────────────────────────────────────────────
export async function apiGetLatestPrediction(
  districtId?: number,
): Promise<PredictionRecordDTO | null> {
  const params = new URLSearchParams();
  if (districtId) params.set("districtId", String(districtId));
  const qs = params.toString();
  try {
    const res = await request<PredictionRecordDTO | "">(
      `/api/v1/predictions/latest${qs ? `?${qs}` : ""}`,
    );
    return res ? (res as PredictionRecordDTO) : null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function apiRunPrediction(
  dto: PredictionRunRequestDTO = {},
): Promise<PredictionRecordDTO> {
  return request<PredictionRecordDTO>("/api/v1/admin/predictions/run", {
    method: "POST",
    body: JSON.stringify(dto),
  });
}

export async function apiGetLatestForecast(
  rdhsId: number,
): Promise<DistrictForecastResponseDTO | null> {
  try {
    return await request<DistrictForecastResponseDTO>(
      `/api/v1/forecasts/${rdhsId}/latest`,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * Generate (or skip) an RDHS-scoped LSTM forecast for the coming week.
 * Auth is sent via the session cookie (`credentials: "include"`).
 */
export async function apiRegenerateForecast(
  rdhsId: number,
): Promise<DistrictForecastResponseDTO | null> {
  const res = await request<DistrictForecastResponseDTO | string>(
    `/api/v1/admin/forecasts/${rdhsId}/regenerate`,
    { method: "POST" },
  );
  if (res && typeof res === "object") return res;
  return null;
}

export async function apiGetClusters(
  districtId?: number,
): Promise<ClusterResponseDTO[]> {
  const params = new URLSearchParams();
  if (districtId) params.set("districtId", String(districtId));
  const qs = params.toString();
  return request<ClusterResponseDTO[]>(
    `/api/v1/clusters${qs ? `?${qs}` : ""}`,
  );
}

export async function apiGetClusterById(
  id: number,
): Promise<ClusterResponseDTO> {
  return request<ClusterResponseDTO>(`/api/v1/clusters/${id}`);
}

export { ApiError };
