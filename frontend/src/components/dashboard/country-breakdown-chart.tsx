"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { GroupBreakdown } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#2563eb", "#7c3aed", "#db2777", "#ea580c", "#16a34a", "#0891b2", "#ca8a04", "#64748b"];

export function CountryBreakdownChart({ data, loading }: { data?: GroupBreakdown[]; loading: boolean }) {
  if (loading || !data) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="headcount" nameKey="key" innerRadius={55} outerRadius={95} paddingAngle={2}>
          {data.map((entry, index) => (
            <Cell key={entry.key} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value, _name, item) => [`${value} employees`, item.payload.key]}
          contentStyle={{
            backgroundColor: "var(--popover)",
            borderColor: "var(--border)",
            color: "var(--popover-foreground)",
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: "var(--muted-foreground)" }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
