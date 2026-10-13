export const COUNTRIES = [
  { country: "United States", currency: "USD" },
  { country: "United Kingdom", currency: "GBP" },
  { country: "Germany", currency: "EUR" },
  { country: "India", currency: "INR" },
  { country: "Canada", currency: "CAD" },
  { country: "Australia", currency: "AUD" },
  { country: "Singapore", currency: "SGD" },
  { country: "Brazil", currency: "BRL" },
] as const;

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Customer Support",
  "Finance",
  "Human Resources",
  "Operations",
  "Legal",
] as const;

export const LEVELS = ["L1", "L2", "L3", "L4", "L5", "L6", "M1", "M2", "M3"] as const;

export const SALARY_CHANGE_REASONS = [
  "HIRE",
  "ANNUAL_REVIEW",
  "PROMOTION",
  "MARKET_ADJUSTMENT",
  "DEMOTION",
  "CORRECTION",
] as const;

export const EMPLOYEE_STATUSES = ["ACTIVE", "TERMINATED"] as const;

export const GENDERS = ["FEMALE", "MALE", "NON_BINARY"] as const;

// Fixed, seed-time snapshot of FX rates. Analytics aggregates across
// currencies using this table instead of calling a live FX provider.
export const EXCHANGE_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  GBP: 1.27,
  EUR: 1.08,
  INR: 0.012,
  CAD: 0.73,
  AUD: 0.66,
  SGD: 0.74,
  BRL: 0.2,
};

export type CountryInfo = (typeof COUNTRIES)[number];
export type Department = (typeof DEPARTMENTS)[number];
export type Level = (typeof LEVELS)[number];
export type SalaryChangeReason = (typeof SALARY_CHANGE_REASONS)[number];
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];
export type Gender = (typeof GENDERS)[number];
