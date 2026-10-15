"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HistogramBucket } from "@/lib/types";
import { formatCompactNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";

export function SalaryDistributionChart({ data, loading }: { data?: HistogramBucket[]; loading: boolean }) {
  if (loading || !data) {
    return <Skeleton className="h-72 w-full" />;
  }

  const chartData = data.map((bucket) => ({
    ...bucket,
    label: `${formatCompactNumber(bucket.rangeStartUsd)}–${formatCompactNumber(bucket.rangeEndUsd)}`,
  }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} interval={0} angle={-25} textAnchor="end" height={50} />
        <YAxis width={40} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} allowDecimals={false} />
        <Tooltip
          formatter={(value) => `${value} employees`}
          contentStyle={{
            backgroundColor: "var(--popover)",
            borderColor: "var(--border)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
