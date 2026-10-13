"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SalaryRecord } from "@/lib/types";
import { formatDate, formatMoney, titleCase } from "@/lib/format";

export function SalaryHistory({ records }: { records: SalaryRecord[] }) {
  if (records.length === 0) {
    return <p className="text-sm text-muted-foreground">No salary records yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Effective date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Reason</TableHead>
          <TableHead>Note</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {records.map((record) => (
          <TableRow key={record.id}>
            <TableCell>{formatDate(record.effectiveDate)}</TableCell>
            <TableCell className="font-medium">{formatMoney(record.amount, record.currency)}</TableCell>
            <TableCell>{titleCase(record.reason)}</TableCell>
            <TableCell className="text-muted-foreground">{record.note ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
