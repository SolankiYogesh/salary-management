"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function PaginationBar({ page, totalPages, total }: { page: number; totalPages: number; total: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function goTo(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(nextPage));
    router.push(`/employees?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between py-3">
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} employees · page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
          Previous
        </Button>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}
