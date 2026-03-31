"use client";

import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminDeleteUserAction } from "@/server/actions/admin-users";
import { adminSetUserActiveAction } from "@/server/actions/admin-trust";

export function AdminUserActionsCell(props: {
  userId: string;
  email: string;
  role: Role;
  isActive: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (props.role === "ADMIN") {
    return <span className="text-xs text-neutral-500">—</span>;
  }

  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
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
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="h-8 border-red-300 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const ok = window.confirm(
              `Удалить пользователя «${props.email}» безвозвратно?\n\nБудут удалены все заказы, где он заказчик, и связанные данные. Отклики этого исполнитца также исчезнут.`,
            );
            if (!ok) return;
            const r = await adminDeleteUserAction({ userId: props.userId });
            if (!r.ok) {
              window.alert(r.error ?? "Ошибка удаления");
              return;
            }
            router.refresh();
          })
        }
      >
        Удалить
      </Button>
    </div>
  );
}
