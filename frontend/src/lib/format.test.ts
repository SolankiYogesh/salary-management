import { describe, expect, it } from "vitest";
import { formatCompactNumber, formatMoney, formatUsd, titleCase } from "./format";

describe("formatMoney", () => {
  it("formats an amount with the given currency symbol and no decimals", () => {
    expect(formatMoney(95000, "USD")).toBe("$95,000");
  });

  it("formats a non-USD currency using en-US grouping", () => {
    expect(formatMoney(1800000, "INR")).toBe("₹1,800,000");
  });
});

describe("formatUsd", () => {
  it("is a USD shorthand for formatMoney", () => {
    expect(formatUsd(1000)).toBe(formatMoney(1000, "USD"));
  });
});

describe("formatCompactNumber", () => {
  it("compacts large numbers", () => {
    expect(formatCompactNumber(1_450_000)).toBe("1.5M");
  });

  it("leaves small numbers mostly as-is", () => {
    expect(formatCompactNumber(950)).toBe("950");
  });
});

describe("titleCase", () => {
  it("converts SCREAMING_SNAKE_CASE to Title Case", () => {
    expect(titleCase("ANNUAL_REVIEW")).toBe("Annual Review");
  });

  it("handles a single word", () => {
    expect(titleCase("HIRE")).toBe("Hire");
  });
});
