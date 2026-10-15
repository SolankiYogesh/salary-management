"use client";

import type { GenderGapRow } from "@/lib/types";
import { formatUsd, titleCase } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export function GenderPayGapTable({ data, loading }: { data?: GenderGapRow[]; loading: boolean }) {
  if (loading || !data) {
    return <Skeleton className="h-72 w-full" />;
  }

  return (
    <div className="max-h-72 overflow-y-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Department</TableHead>
            <TableHead>Avg by gender (USD)</TableHead>
            <TableHead className="text-right">Male–female gap</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.department}>
              <TableCell className="font-medium">{row.department}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {Object.entries(row.avgByGender)
                  .map(([gender, avg]) => `${titleCase(gender)}: ${formatUsd(avg)}`)
                  .join(" · ")}
              </TableCell>
              <TableCell className="text-right">
                {row.gapPct === null ? (
                  <Badge variant="outline">n/a</Badge>
                ) : (
                  <Badge variant={Math.abs(row.gapPct) > 5 ? "destructive" : "secondary"}>
                    {row.gapPct.toFixed(1)}%
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
