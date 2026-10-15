"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployees, fetchMeta } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EmployeeFilters } from "@/components/employees/employee-filters";
import { EmployeeTable } from "@/components/employees/employee-table";
import { PaginationBar } from "@/components/employees/pagination-bar";

export default function EmployeesPage() {
  return (
    <Suspense>
      <EmployeesPageContent />
    </Suspense>
  );
}

function EmployeesPageContent() {
  const searchParams = useSearchParams();
  const meta = useQuery({ queryKey: ["meta"], queryFn: fetchMeta });

  const page = Number(searchParams.get("page") ?? 1);
  const params = {
    search: searchParams.get("search") ?? undefined,
    department: searchParams.get("department") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    sortBy: searchParams.get("sortBy") ?? undefined,
    sortDir: searchParams.get("sortDir") ?? undefined,
    page,
    pageSize: 25,
  };

  const employees = useQuery({
    queryKey: ["employees", params],
    queryFn: () => fetchEmployees(params),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground">Search and manage the full employee roster.</p>
        </div>
        <Button render={<Link href="/employees/new" />} nativeButton={false}>
          Add employee
        </Button>
      </div>

      <EmployeeFilters meta={meta.data} />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto px-4">
            <EmployeeTable rows={employees.data?.items} loading={employees.isLoading} />
          </div>
          {employees.data && (
            <>
              <Separator />
              <div className="px-4">
                <PaginationBar page={employees.data.page} totalPages={employees.data.totalPages} total={employees.data.total} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
