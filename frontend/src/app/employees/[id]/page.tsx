"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchEmployee, fetchMeta } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { SalaryHistory } from "@/components/employees/salary-history";
import { AddSalaryRecordDialog } from "@/components/employees/add-salary-record-dialog";
import { formatDate } from "@/lib/format";
import { pickCurrentSalaryRecord } from "@/lib/salary";

export default function EmployeeDetailPage() {
  const params = useParams<{ id: string }>();
  const meta = useQuery({ queryKey: ["meta"], queryFn: fetchMeta });
  const employee = useQuery({
    queryKey: ["employee", params.id],
    queryFn: () => fetchEmployee(params.id),
  });

  if (employee.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (employee.isError || !employee.data) {
    return <p className="text-muted-foreground">Employee not found.</p>;
  }

  const emp = employee.data;
  const current = pickCurrentSalaryRecord(emp.salaryRecords);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {emp.firstName} {emp.lastName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {emp.jobTitle} · {emp.employeeCode}
          </p>
        </div>
        <Badge variant={emp.status === "ACTIVE" ? "secondary" : "outline"}>{emp.status}</Badge>
      </div>

      <Separator />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-y-3 text-sm">
            <Field label="Email" value={emp.email} />
            <Field label="Department" value={emp.department} />
            <Field label="Level" value={emp.level} />
            <Field label="Country" value={emp.country} />
            <Field label="Hire date" value={formatDate(emp.hireDate)} />
            <Field label="Current salary" value={current ? `${current.amount.toLocaleString()} ${current.currency}` : "—"} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Salary history</CardTitle>
            {meta.data && (
              <AddSalaryRecordDialog employeeId={emp.id} currency={emp.currency} reasons={meta.data.salaryChangeReasons} />
            )}
          </CardHeader>
          <CardContent>
            <SalaryHistory records={emp.salaryRecords} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <Label className="text-xs font-normal text-muted-foreground">{label}</Label>
      <p className="font-medium">{value}</p>
    </div>
  );
}
