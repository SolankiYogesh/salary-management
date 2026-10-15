"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchBreakdown, fetchDistribution, fetchGenderPayGap, fetchOverview } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCompactNumber, formatUsd } from "@/lib/format";
import { PayrollBreakdownChart } from "@/components/dashboard/department-pay-chart";
import { SalaryDistributionChart } from "@/components/dashboard/salary-distribution-chart";
import { GenderPayGapTable } from "@/components/dashboard/gender-pay-gap-table";
import { CountryBreakdownChart } from "@/components/dashboard/country-breakdown-chart";

export default function DashboardPage() {
  const overview = useQuery({ queryKey: ["analytics", "overview"], queryFn: fetchOverview });
  const byDepartment = useQuery({
    queryKey: ["analytics", "breakdown", "department"],
    queryFn: () => fetchBreakdown("department"),
  });
  const byCountry = useQuery({
    queryKey: ["analytics", "breakdown", "country"],
    queryFn: () => fetchBreakdown("country"),
  });
  const byLevel = useQuery({
    queryKey: ["analytics", "breakdown", "level"],
    queryFn: () => fetchBreakdown("level"),
  });
  const distribution = useQuery({ queryKey: ["analytics", "distribution"], queryFn: fetchDistribution });
  const genderGap = useQuery({ queryKey: ["analytics", "gender-pay-gap"], queryFn: fetchGenderPayGap });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pay overview</h1>
        <p className="text-sm text-muted-foreground">How ACME pays its active employees, across every country.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active headcount"
          value={overview.data ? formatCompactNumber(overview.data.headcount) : undefined}
          loading={overview.isLoading}
        />
        <StatCard
          label="Total payroll (USD/yr)"
          value={overview.data ? formatUsd(overview.data.totalPayrollUsd) : undefined}
          loading={overview.isLoading}
        />
        <StatCard
          label="Average salary (USD)"
          value={overview.data ? formatUsd(overview.data.avgSalaryUsd) : undefined}
          loading={overview.isLoading}
        />
        <StatCard
          label="Median salary (USD)"
          value={overview.data ? formatUsd(overview.data.medianSalaryUsd) : undefined}
          loading={overview.isLoading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <Tabs defaultValue="department">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payroll breakdown</CardTitle>
              <TabsList>
                <TabsTrigger value="department">Department</TabsTrigger>
                <TabsTrigger value="country">Country</TabsTrigger>
                <TabsTrigger value="level">Level</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="department">
                <PayrollBreakdownChart data={byDepartment.data} loading={byDepartment.isLoading} />
              </TabsContent>
              <TabsContent value="country">
                <PayrollBreakdownChart data={byCountry.data} loading={byCountry.isLoading} />
              </TabsContent>
              <TabsContent value="level">
                <PayrollBreakdownChart data={byLevel.data} loading={byLevel.isLoading} />
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Headcount by country</CardTitle>
          </CardHeader>
          <CardContent>
            <CountryBreakdownChart data={byCountry.data} loading={byCountry.isLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <SalaryDistributionChart data={distribution.data} loading={distribution.isLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gender pay gap by department</CardTitle>
          </CardHeader>
          <CardContent>
            <GenderPayGapTable data={genderGap.data} loading={genderGap.isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, loading }: { label: string; value?: string; loading: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        {loading || value === undefined ? (
          <Skeleton className="mt-2 h-8 w-24" />
        ) : (
          <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
        )}
      </CardContent>
    </Card>
  );
}
