import { prisma } from "@/lib/db";
import { maskInviteeEmail } from "@/lib/referral";

export type ReferralHistoryRow = {
  id: string;
  maskedEmail: string;
  registeredAtIso: string;
  rewardRubles: number;
};

export async function listReferralHistoryForReferrer(
  referrerId: string,
  limit = 100,
): Promise<ReferralHistoryRow[]> {
  const rows = await prisma.referralSignup.findMany({
    where: { referrerId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { referredUser: { select: { email: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    maskedEmail: maskInviteeEmail(r.referredUser.email),
    registeredAtIso: r.createdAt.toISOString(),
    rewardRubles: Math.round(r.rewardCents / 100),
  }));
}

export async function sumReferralRewardsRublesForReferrer(referrerId: string): Promise<number> {
  const agg = await prisma.referralSignup.aggregate({
    where: { referrerId },
    _sum: { rewardCents: true },
  });
  return Math.round((agg._sum.rewardCents ?? 0) / 100);
}
