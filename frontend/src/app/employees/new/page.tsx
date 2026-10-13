"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiError, createEmployee, fetchMeta } from "@/lib/api";

const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
  email: z.string().email("Enter a valid email"),
  gender: z.string().min(1, "Required"),
  country: z.string().min(1, "Required"),
  department: z.string().min(1, "Required"),
  jobTitle: z.string().min(1, "Required"),
  level: z.string().min(1, "Required"),
  hireDate: z.string().min(1, "Required"),
  startingSalary: z.coerce.number().positive("Must be greater than 0"),
});

type FormValues = z.infer<typeof schema>;

export default function NewEmployeePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const meta = useQuery({ queryKey: ["meta"], queryFn: fetchMeta });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      gender: "",
      country: "",
      department: "",
      jobTitle: "",
      level: "",
      hireDate: "",
      startingSalary: 0,
    },
  });

  const country = watch("country");
  const currency = meta.data?.countries.find((c) => c.country === country)?.currency ?? "USD";

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createEmployee({ ...values, currency }),
    onSuccess: (employee) => {
      toast.success("Employee created");
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      router.push(`/employees/${employee.id}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to create employee");
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Add employee</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First name" error={errors.firstName?.message}>
                <Input {...register("firstName")} />
              </Field>
              <Field label="Last name" error={errors.lastName?.message}>
                <Input {...register("lastName")} />
              </Field>
            </div>

            <Field label="Email" error={errors.email?.message}>
              <Input type="email" {...register("email")} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Gender" error={errors.gender?.message}>
                <Select value={watch("gender")} onValueChange={(v) => v && setValue("gender", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.data?.genders.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Country" error={errors.country?.message}>
                <Select value={watch("country")} onValueChange={(v) => v && setValue("country", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.data?.countries.map((c) => (
                      <SelectItem key={c.country} value={c.country}>
                        {c.country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Department" error={errors.department?.message}>
                <Select value={watch("department")} onValueChange={(v) => v && setValue("department", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.data?.departments.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Level" error={errors.level?.message}>
                <Select value={watch("level")} onValueChange={(v) => v && setValue("level", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {meta.data?.levels.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Job title" error={errors.jobTitle?.message}>
              <Input {...register("jobTitle")} placeholder="e.g. Senior Engineer" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Hire date" error={errors.hireDate?.message}>
                <Input type="date" {...register("hireDate")} />
              </Field>

              <Field label={`Starting salary (${currency})`} error={errors.startingSalary?.message}>
                <Input type="number" step="0.01" {...register("startingSalary")} />
              </Field>
            </div>

            <Button type="submit" disabled={mutation.isPending} className="mt-2">
              {mutation.isPending ? "Creating..." : "Create employee"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
