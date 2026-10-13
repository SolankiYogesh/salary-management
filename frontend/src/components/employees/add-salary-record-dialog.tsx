"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addSalaryRecord, ApiError } from "@/lib/api";
import { titleCase } from "@/lib/format";

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  reason: z.string().min(1, "Reason is required"),
  effectiveDate: z.string().min(1, "Effective date is required"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddSalaryRecordDialog({
  employeeId,
  currency,
  reasons,
}: {
  employeeId: string;
  currency: string;
  reasons: string[];
}) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, reason: "ANNUAL_REVIEW", effectiveDate: "", note: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      addSalaryRecord(employeeId, {
        amount: values.amount,
        currency,
        reason: values.reason,
        effectiveDate: values.effectiveDate,
        note: values.note || undefined,
      }),
    onSuccess: () => {
      toast.success("Salary record added");
      queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      setOpen(false);
      reset();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to add salary record");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add salary change</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a salary change</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input id="amount" type="number" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Reason</Label>
            <Select value={watch("reason")} onValueChange={(v) => v && setValue("reason", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {titleCase(reason)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="effectiveDate">Effective date</Label>
            <Input id="effectiveDate" type="date" {...register("effectiveDate")} />
            {errors.effectiveDate && <p className="text-xs text-destructive">{errors.effectiveDate.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" {...register("note")} placeholder="e.g. Promoted to Staff Engineer" />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
