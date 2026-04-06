"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addOrderCustomerPartnerAction,
  removeOrderCustomerPartnerAction,
} from "@/server/actions/order-customer-partners";

export type PartnerRow = { userId: string; label: string };

export function OrderCustomerPartnersManage({ orderId, partners }: { orderId: string; partners: PartnerRow[] }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50/80 p-3 dark:border-neutral-800 dark:bg-neutral-900/40">
      <h3 className="text-sm font-medium text-neutral-800 dark:text-neutral-200">Соучастники заказа</h3>
      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
        Добавьте email другого заказчика — он увидит заказ в своём кабинете и сможет участвовать в чате. Резерв суммы под
        заказ и решения по специалисту остаются за вами как за основным заказчиком.
      </p>
      {msg ? (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor={`partner-email-${orderId}`}>Email соучастника</Label>
          <Input
            id={`partner-email-${orderId}`}
            type="email"
            autoComplete="email"
            placeholder="kollega@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </div>
        <Button
          type="button"
          size="sm"
          disabled={pending || !email.trim()}
          onClick={() => {
            setMsg(null);
            startTransition(async () => {
              const r = await addOrderCustomerPartnerAction({ orderId, email: email.trim() });
              if (!r.ok) {
                setMsg(r.error ?? "Не удалось добавить");
                return;
              }
              setEmail("");
              router.refresh();
            });
          }}
        >
          Добавить
        </Button>
      </div>
      {partners.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm">
          {partners.map((p) => (
            <li
              key={p.userId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-neutral-100 px-2 py-1.5 dark:border-neutral-800"
            >
              <span className="text-neutral-800 dark:text-neutral-200">{p.label}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 text-red-600 hover:text-red-700 dark:text-red-400"
                disabled={pending}
                onClick={() => {
                  if (!window.confirm("Убрать соучастника с заказа? Он потеряет доступ к карточке и чату.")) return;
                  setMsg(null);
                  startTransition(async () => {
                    const r = await removeOrderCustomerPartnerAction({ orderId, partnerUserId: p.userId });
                    if (!r.ok) {
                      setMsg(r.error ?? "Не удалось убрать");
                      return;
                    }
                    router.refresh();
                  });
                }}
              >
                Убрать
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">Пока только вы как основной заказчик.</p>
      )}
    </div>
  );
}
