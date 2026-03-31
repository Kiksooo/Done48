import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { getPlatformSettings } from "@/server/queries/platform-settings";

export default async function AdminSettingsPage() {
  const s = await getPlatformSettings();
  const fee = s ? Number(s.platformFeePercent) : 10;
  const minPayoutRubles = s ? s.minPayoutCents / 100 : 10;
  const moderateAllNewOrders = s?.moderateAllNewOrders ?? true;
  const maxExecutorProposalsPerDay = s?.maxExecutorProposalsPerDay ?? 30;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Настройки платформы</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Запись <code className="text-xs">PlatformSettings</code> (id = default): модерация, отклики и финансы.
        </p>
      </div>
      <PlatformSettingsForm
        platformFeePercent={fee}
        minPayoutRubles={minPayoutRubles}
        moderateAllNewOrders={moderateAllNewOrders}
        maxExecutorProposalsPerDay={maxExecutorProposalsPerDay}
      />
    </div>
  );
}
