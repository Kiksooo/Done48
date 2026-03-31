"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customerDemoWithdrawAction } from "@/server/actions/finance/customer-finance";

type Form = { rubles: number };

export function CustomerWithdrawForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const form = useForm<Form>({ defaultValues: { rubles: 100 } });

  return (
    <form
      className="flex flex-wrap items-end gap-3"
      onSubmit={form.handleSubmit((values) => {
        startTransition(async () => {
          const r = await customerDemoWithdrawAction(values);
          if (r.ok) {
            form.reset({ rubles: 100 });
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
        <Label htmlFor="wd-rubles">Сумма вывода (₽)</Label>
        <Input
          id="wd-rubles"
          type="number"
          min={1}
          step={1}
          disabled={pending}
          {...form.register("rubles", { valueAsNumber: true })}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "…" : "Вывести (демо)"}
      </Button>
      <p className="w-full text-xs text-neutral-500">
        Учебный вывод: деньги списываются с баланса в системе, без реального перевода на карту.
      </p>
    </form>
  );
}
