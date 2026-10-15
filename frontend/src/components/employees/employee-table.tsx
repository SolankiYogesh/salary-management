"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { EmployeeListRow } from "@/lib/types";
import { formatDate, formatMoney, formatUsd } from "@/lib/format";

const SORTABLE: Array<{ key: string; label: string }> = [
  { key: "name", label: "Name" },
  { key: "hireDate", label: "Hire date" },
  { key: "currentSalaryUsd", label: "Current salary" },
];

export function EmployeeTable({ rows, loading }: { rows?: EmployeeListRow[]; loading: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sortBy = searchParams.get("sortBy") ?? "name";
  const sortDir = searchParams.get("sortDir") ?? "asc";

  function toggleSort(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (sortBy === key) {
      params.set("sortDir", sortDir === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", key);
      params.set("sortDir", "asc");
    }
    router.push(`/employees?${params.toString()}`);
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {SORTABLE.map((col) => (
            <TableHead key={col.key}>
              <Button variant="ghost" size="sm" onClick={() => toggleSort(col.key)}>
                {col.label}
                {sortBy === col.key ? (
                  sortDir === "asc" ? (
                    <ArrowUp />
                  ) : (
                    <ArrowDown />
                  )
                ) : (
                  <ArrowUpDown className="opacity-50" />
                )}
              </Button>
            </TableHead>
          ))}
          <TableHead>Department</TableHead>
          <TableHead>Country</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: 8 }).map((__, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}

        {!loading &&
          rows?.map((row) => (
            <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/employees/${row.id}`)}>
              <TableCell>
                <Link href={`/employees/${row.id}`} className="font-medium hover:underline">
                  {row.firstName} {row.lastName}
                </Link>
                <div className="text-xs text-muted-foreground">{row.employeeCode}</div>
              </TableCell>
              <TableCell>{formatDate(row.hireDate)}</TableCell>
              <TableCell>
                {formatMoney(row.currentSalary, row.currentCurrency)}
                {row.currentCurrency !== "USD" && (
                  <div className="text-xs text-muted-foreground">{formatUsd(row.currentSalaryUsd)}</div>
                )}
              </TableCell>
              <TableCell>{row.department}</TableCell>
              <TableCell>{row.country}</TableCell>
              <TableCell className="max-w-48 truncate">{row.jobTitle}</TableCell>
              <TableCell>
                <Badge variant={row.status === "ACTIVE" ? "secondary" : "outline"}>{row.status}</Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.firstName} ${row.lastName}`}>
                        <MoreHorizontal />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/employees/${row.id}`)}>
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(row.email).catch(() => undefined)}
                    >
                      Copy email
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}

        {!loading && rows?.length === 0 && (
          <TableRow>
            <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
              No employees match these filters.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
