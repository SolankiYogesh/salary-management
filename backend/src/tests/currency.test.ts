import { describe, expect, it } from "vitest";
import { toUsd } from "../lib/currency.js";

describe("toUsd", () => {
  it("converts USD at a 1:1 rate", () => {
    expect(toUsd(1000, "USD")).toBe(1000);
  });

  it("converts a non-USD currency using its exchange rate", () => {
    expect(toUsd(100_000, "INR")).toBeCloseTo(1200, 5);
  });

  it("throws for an unknown currency", () => {
    expect(() => toUsd(100, "XYZ")).toThrowError(/Unknown currency/);
  });
});
