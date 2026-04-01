import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getSessionUserForAction } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { setMarketingOptInAction } from "@/server/actions/marketing";

export const metadata: Metadata = {
  title: { absolute: "Управление рассылкой — DONE48" },
  description: "Настройки подписки на рассылки DONE48.",
  robots: { index: false, follow: false },
};

export default async function MarketingUnsubscribePage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: { marketingOptIn: true },
  });

  async function unsubscribe() {
    "use server";
    await setMarketingOptInAction(false);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Управление рассылкой</h1>
        {row?.marketingOptIn ? (
          <>
            <p className="mt-3 text-sm text-muted-foreground">
              Подписка на рекламные и продуктовые рассылки сейчас включена.
            </p>
            <form action={unsubscribe} className="mt-5">
              <Button type="submit" variant="outline">
                Отписаться от рассылки
              </Button>
            </form>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Вы уже отписаны от рекламной рассылки.</p>
        )}
      </div>
    </div>
  );
}
