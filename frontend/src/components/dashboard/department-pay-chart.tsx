"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupBreakdown } from "@/lib/types";
import { formatCompactNumber, formatUsd } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function PayrollBreakdownChart({ data, loading }: { data?: GroupBreakdown[]; loading: boolean }) {
  if (loading || !data) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="key" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} interval={0} angle={-25} textAnchor="end" height={60} />
        <YAxis tickFormatter={(value) => formatCompactNumber(value)} width={56} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
        <Tooltip
          formatter={(value) => formatUsd(Number(value))}
          cursor={{ fill: "var(--muted)" }}
          contentStyle={{
            backgroundColor: "var(--popover)",
            borderColor: "var(--border)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="totalPayrollUsd" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
