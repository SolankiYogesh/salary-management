export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: string;
  country: string;
  currency: string;
  department: string;
  jobTitle: string;
  level: string;
  status: "ACTIVE" | "TERMINATED";
  hireDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalaryRecord {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  reason: string;
  effectiveDate: string;
  note: string | null;
  createdAt: string;
}

export interface EmployeeDetail extends Employee {
  salaryRecords: SalaryRecord[];
}

export interface EmployeeListRow {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  country: string;
  jobTitle: string;
  level: string;
  status: string;
  hireDate: string;
  currentSalary: number;
  currentCurrency: string;
  currentSalaryUsd: number;
}

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface CountryInfo {
  country: string;
  currency: string;
}

export interface MetaResponse {
  countries: CountryInfo[];
  departments: string[];
  levels: string[];
  salaryChangeReasons: string[];
  employeeStatuses: string[];
  genders: string[];
}

export interface Overview {
  headcount: number;
  totalPayrollUsd: number;
  avgSalaryUsd: number;
  medianSalaryUsd: number;
}

export interface GroupBreakdown {
  key: string;
  headcount: number;
  totalPayrollUsd: number;
  avgSalaryUsd: number;
}

export interface HistogramBucket {
  rangeStartUsd: number;
  rangeEndUsd: number;
  count: number;
}

export interface GenderGapRow {
  department: string;
  avgByGender: Record<string, number>;
  gapPct: number | null;
}
