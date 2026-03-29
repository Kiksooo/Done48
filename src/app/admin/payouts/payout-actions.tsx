"use client";

import { PayoutStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  adminApprovePayoutAction,
  adminMarkPayoutPaidAction,
  adminRejectPayoutAction,
} from "@/server/actions/finance/admin-finance";

export function PayoutActions({ payoutId, status }: { payoutId: string; status: PayoutStatus }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) router.refresh();
      else alert(r.error);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {status === "PENDING" ? (
        <>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => run(() => adminApprovePayoutAction({ payoutId }))}
          >
            Одобрить
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => run(() => adminRejectPayoutAction({ payoutId }))}
          >
            Отклонить
          </Button>
        </>
      ) : null}
      {status === "APPROVED" ? (
        <Button
          type="button"
          size="sm"
          disabled={pending}
          onClick={() => run(() => adminMarkPayoutPaidAction({ payoutId }))}
        >
          Отметить выплаченным
        </Button>
      ) : null}
    </div>
  );
}
