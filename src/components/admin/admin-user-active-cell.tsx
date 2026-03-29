"use client";

import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminSetUserActiveAction } from "@/server/actions/admin-trust";

export function AdminUserActiveCell(props: { userId: string; role: Role; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (props.role === "ADMIN") {
    return <span className="text-xs text-neutral-500">—</span>;
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={props.isActive ? "destructive" : "outline"}
      className="h-8"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await adminSetUserActiveAction({ userId: props.userId, isActive: !props.isActive });
          router.refresh();
        })
      }
    >
      {props.isActive ? "Заблокировать" : "Разблокировать"}
    </Button>
  );
}
