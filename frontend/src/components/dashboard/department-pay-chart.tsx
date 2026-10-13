"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupBreakdown } from "@/lib/types";
import { formatCompactNumber, formatUsd } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function DepartmentPayChart({ data, loading }: { data?: GroupBreakdown[]; loading: boolean }) {
  if (loading || !data) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="key" tick={{ fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tickFormatter={(value) => formatCompactNumber(value)} width={56} tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value) => formatUsd(Number(value))} cursor={{ fill: "var(--muted)" }} />
        <Bar dataKey="totalPayrollUsd" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
