"use client";

import { UserReportCategory } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitUserReportAction } from "@/server/actions/user-report";

const CATEGORY_LABELS: Record<UserReportCategory, string> = {
  SCAM: "Мошенничество / обман",
  HARASSMENT: "Оскорбления / давление",
  FAKE_IDENTITY: "Поддельные данные / личность",
  SPAM: "Спам / навязчивость",
  OTHER: "Другое",
};

export function OrderReportSection(props: { orderId: string; targetEmail: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [category, setCategory] = useState<UserReportCategory>("SCAM");
  const [description, setDescription] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  return (
    <section className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
      <h2 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Жалоба на пользователя</h2>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
        Контрагент по заказу: <span className="font-mono">{props.targetEmail}</span>. Опишите факты — модератор
        рассмотрит обращение. Злоупотребление жалобами может привести к блокировке.
      </p>
      {ok ? (
        <p className="mt-3 text-sm font-medium text-green-800 dark:text-green-300">
          Жалоба отправлена. Спасибо, что помогаете держать площадку в порядке.
        </p>
      ) : (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            startTransition(async () => {
              const r = await submitUserReportAction({
                orderId: props.orderId,
                category,
                description,
              });
              if (!r.ok) {
                setMsg(r.error ?? "Ошибка");
                return;
              }
              setOk(true);
              setDescription("");
              router.refresh();
            });
          }}
        >
          {msg ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {msg}
            </p>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor="rep-cat">Категория</Label>
            <select
              id="rep-cat"
              className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
              value={category}
              onChange={(e) => setCategory(e.target.value as UserReportCategory)}
              disabled={pending}
            >
              {(Object.keys(CATEGORY_LABELS) as UserReportCategory[]).map((k) => (
                <option key={k} value={k}>
                  {CATEGORY_LABELS[k]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rep-text">Что произошло</Label>
            <Textarea
              id="rep-text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={4}
              placeholder="Факты, даты, цитаты из чата (без личных данных третьих лиц)"
              className="resize-y"
            />
          </div>
          <Button type="submit" size="sm" variant="secondary" disabled={pending}>
            {pending ? "Отправка…" : "Отправить жалобу"}
          </Button>
        </form>
      )}
    </section>
  );
}
