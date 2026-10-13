import type {
  EmployeeDetail,
  EmployeeListRow,
  GenderGapRow,
  GroupBreakdown,
  HistogramBucket,
  MetaResponse,
  Overview,
  PageResult,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4310/api";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export interface EmployeeListParams {
  search?: string;
  department?: string;
  country?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: string;
  [key: string]: string | number | undefined;
}

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function fetchEmployees(params: EmployeeListParams): Promise<PageResult<EmployeeListRow>> {
  return request(`/employees${toQueryString(params)}`);
}

export function fetchEmployee(id: string): Promise<EmployeeDetail> {
  return request(`/employees/${id}`);
}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  country: string;
  currency: string;
  department: string;
  jobTitle: string;
  level: string;
  hireDate: string;
  startingSalary: number;
}

export function createEmployee(input: CreateEmployeeInput): Promise<EmployeeDetail> {
  return request("/employees", { method: "POST", body: JSON.stringify(input) });
}

export interface CreateSalaryRecordInput {
  amount: number;
  currency: string;
  reason: string;
  effectiveDate: string;
  note?: string;
}

export function addSalaryRecord(employeeId: string, input: CreateSalaryRecordInput) {
  return request(`/employees/${employeeId}/salary-records`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function fetchMeta(): Promise<MetaResponse> {
  return request("/meta");
}

export function fetchOverview(): Promise<Overview> {
  return request("/analytics/overview");
}

export function fetchBreakdown(dimension: "department" | "country" | "level"): Promise<GroupBreakdown[]> {
  return request(`/analytics/breakdown/${dimension}`);
}

export function fetchDistribution(): Promise<HistogramBucket[]> {
  return request("/analytics/distribution");
}

export function fetchGenderPayGap(): Promise<GenderGapRow[]> {
  return request("/analytics/gender-pay-gap");
}
