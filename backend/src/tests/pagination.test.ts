import { describe, expect, it } from "vitest";
import { parsePageRequest, toPageResult } from "../lib/pagination.js";

describe("parsePageRequest", () => {
  it("defaults to page 1 and pageSize 25 when unspecified", () => {
    expect(parsePageRequest({})).toEqual({ page: 1, pageSize: 25 });
  });

  it("parses valid page and pageSize values", () => {
    expect(parsePageRequest({ page: "3", pageSize: "50" })).toEqual({ page: 3, pageSize: 50 });
  });

  it("clamps page to a minimum of 1", () => {
    expect(parsePageRequest({ page: "-5" })).toEqual({ page: 1, pageSize: 25 });
  });

  it("clamps pageSize to a maximum of 100", () => {
    expect(parsePageRequest({ pageSize: "500" })).toEqual({ page: 1, pageSize: 100 });
  });
});

describe("toPageResult", () => {
  it("computes totalPages from total and pageSize", () => {
    const result = toPageResult([1, 2, 3], 97, { page: 1, pageSize: 25 });
    expect(result.totalPages).toBe(4);
  });

  it("always reports at least 1 page even when total is 0", () => {
    const result = toPageResult([], 0, { page: 1, pageSize: 25 });
    expect(result.totalPages).toBe(1);
  });
});
