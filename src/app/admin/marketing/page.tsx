import { MarketingCampaignForm } from "@/components/admin/marketing-campaign-form";
import { prisma } from "@/lib/db";

export default async function AdminMarketingPage() {
  const subscribersTotal = await prisma.user.count({
    where: { isActive: true, marketingOptIn: true },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Рассылки</h1>
        <p className="text-sm text-muted-foreground">
          Рекламные и продуктовые уведомления только по opt-in подписке пользователей.
        </p>
      </div>
      <MarketingCampaignForm subscribersTotal={subscribersTotal} />
    </div>
  );
}
