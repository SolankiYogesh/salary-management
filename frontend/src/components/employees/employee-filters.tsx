"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MetaResponse } from "@/lib/types";

const ALL = "ALL";

export function EmployeeFilters({ meta }: { meta?: MetaResponse }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (search !== (searchParams.get("search") ?? "")) {
        updateParam("search", search);
      }
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === ALL) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete("page");
    router.push(`/employees?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Input
        placeholder="Search name, email or employee code..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-64"
      />

      <Select value={searchParams.get("department") ?? ALL} onValueChange={(v) => updateParam("department", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All departments</SelectItem>
          {meta?.departments.map((d) => (
            <SelectItem key={d} value={d}>
              {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("country") ?? ALL} onValueChange={(v) => updateParam("country", v)}>
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All countries</SelectItem>
          {meta?.countries.map((c) => (
            <SelectItem key={c.country} value={c.country}>
              {c.country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get("status") ?? ALL} onValueChange={(v) => updateParam("status", v)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Any status</SelectItem>
          {meta?.employeeStatuses.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
