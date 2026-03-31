import { prisma } from "@/lib/db";

export type AntifraudPlatformSettings = {
  moderateAllNewOrders: boolean;
  requireExecutorVerificationForProposals: boolean;
  maxExecutorProposalsPerDay: number;
};

/** Настройки против злоупотреблений (с дефолтами, если строки настроек ещё нет). */
export async function getAntifraudPlatformSettings(): Promise<AntifraudPlatformSettings> {
  try {
    const s = await prisma.platformSettings.findUnique({ where: { id: "default" } });
    return {
      moderateAllNewOrders: s?.moderateAllNewOrders ?? true,
      requireExecutorVerificationForProposals: s?.requireExecutorVerificationForProposals ?? true,
      maxExecutorProposalsPerDay: s?.maxExecutorProposalsPerDay ?? 30,
    };
  } catch {
    return {
      moderateAllNewOrders: true,
      requireExecutorVerificationForProposals: true,
      maxExecutorProposalsPerDay: 30,
    };
  }
}
