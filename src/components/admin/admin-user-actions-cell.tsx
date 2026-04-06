"use client";

import type { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { adminDeleteUserAction, adminSetUserRoleAction } from "@/server/actions/admin-users";
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
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={pending || props.role === "CUSTOMER"}
          title="Кабинет заказчика"
          onClick={() =>
            startTransition(async () => {
              const ok = window.confirm(
                `Назначить пользователю «${props.email}» роль «Заказчик»?\n\nКабинет станет заказческим; данные профиля специалиста в базе сохранятся.`,
              );
              if (!ok) return;
              const r = await adminSetUserRoleAction({ userId: props.userId, role: "CUSTOMER" });
              if (!r.ok) {
                window.alert(r.error ?? "Не удалось сменить роль");
                return;
              }
              router.refresh();
            })
          }
        >
          Заказчик
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8"
          disabled={pending || props.role === "EXECUTOR"}
          title="Кабинет специалиста"
          onClick={() =>
            startTransition(async () => {
              const ok = window.confirm(
                `Назначить пользователю «${props.email}» роль «Специалист»?\n\nКабинет станет специалистским; анкета будет в статусе «Активен»; данные профиля заказчика сохранятся.`,
              );
              if (!ok) return;
              const r = await adminSetUserRoleAction({ userId: props.userId, role: "EXECUTOR" });
              if (!r.ok) {
                window.alert(r.error ?? "Не удалось сменить роль");
                return;
              }
              router.refresh();
            })
          }
        >
          Специалист
        </Button>
      </div>
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
              `Удалить пользователя «${props.email}» безвозвратно?\n\nБудут удалены все заказы, где он заказчик, и связанные данные. Отклики этого специалиста также исчезнут.`,
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
    </div>
  );
}
