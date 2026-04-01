import { MarketingCampaignForm } from "@/components/admin/marketing-campaign-form";
import { prisma } from "@/lib/db";

export default async function AdminMarketingPage() {
  let subscribersTotal = 0;
  let loadError: string | null = null;
  try {
    subscribersTotal = await prisma.user.count({
      where: { isActive: true, marketingOptIn: true },
    });
  } catch {
    loadError =
      "Не удалось прочитать подписчиков: в базе, скорее всего, не применена миграция marketing_opt_in. На сервере выполните: npx prisma migrate deploy";
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Рассылки</h1>
        <p className="text-sm text-muted-foreground">
          Рекламные и продуктовые уведомления только по opt-in подписке пользователей.
        </p>
      </div>
      {loadError ? (
        <div className="max-w-2xl rounded-lg border border-destructive/50 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {loadError}
        </div>
      ) : null}
      <MarketingCampaignForm subscribersTotal={subscribersTotal} disabled={Boolean(loadError)} />
    </div>
  );
}
