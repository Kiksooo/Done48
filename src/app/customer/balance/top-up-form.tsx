"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerDemoTopUpAction } from "@/server/actions/finance/customer-finance";

type Form = { rubles: number };

export function CustomerTopUpForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({ defaultValues: { rubles: 1000 } });

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={form.handleSubmit((values) => {
        startTransition(async () => {
          const r = await customerDemoTopUpAction(values);
          if (r.ok) {
            form.reset({ rubles: 1000 });
            router.refresh();
          } else {
            form.setError("root", { message: r.error });
          }
        });
      })}
    >
      {form.formState.errors.root ? (
        <p className="w-full text-sm text-red-600">{form.formState.errors.root.message}</p>
      ) : null}
      <div className="space-y-1">
        <Label htmlFor="rubles">Сумма (₽)</Label>
        <Input
          id="rubles"
          type="number"
          min={1}
          step={1}
          disabled={pending}
          {...form.register("rubles", { valueAsNumber: true })}
        />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "…" : "Пополнить (демо)"}
      </Button>
      <p className="w-full text-xs text-neutral-500">
        Реальный платёж не подключён — для теста баланса и резерва.
      </p>
    </form>
  );
}
