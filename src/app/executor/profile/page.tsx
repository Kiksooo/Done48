import Link from "next/link";
import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { MarketingSubscriptionCard } from "@/components/profile/marketing-subscription-card";
import { ExecutorProfileForm } from "@/components/profile/executor-profile-form";
import { ReferralCard } from "@/components/profile/referral-card";
import { ProfileReviewsSection } from "@/components/reviews/profile-reviews-section";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { getSiteUrl } from "@/lib/site-url";
import { redirect } from "next/navigation";
import {
  listReferralHistoryForReferrer,
  sumReferralRewardsRublesForReferrer,
} from "@/server/queries/referrals";
import { getReviewStatsForUser, listReviewsReceivedByUser } from "@/server/queries/reviews";

export default async function ExecutorProfilePage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const [profile, stats, receivedReviews, prefs, referralHistory, referralTotalRubles] =
    await Promise.all([
      prisma.executorProfile.findUnique({ where: { userId: user.id } }),
      getReviewStatsForUser(user.id),
      listReviewsReceivedByUser(user.id, 40),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { marketingOptIn: true, marketingOptInAt: true },
      }),
      listReferralHistoryForReferrer(user.id),
      sumReferralRewardsRublesForReferrer(user.id),
    ]);

  if (!profile) {
    return <p className="text-sm text-neutral-600">Профиль не найден.</p>;
  }

  const referralLink = `${getSiteUrl()}/register?ref=${encodeURIComponent(user.id)}`;

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Профиль" },
        ]}
        title="Профиль исполнителя"
        description="Публичные поля профиля и контакты. Отклики на заказы доступны при статусе «Активен» (обычно сразу после регистрации). При необходимости администратор может изменить статус в разделе «Исполнители»."
      />
      {profile.username ? (
        <p className="text-sm text-muted-foreground">
          Публичная страница:{" "}
          <Link
            href={`/u/${profile.username}`}
            className="font-mono font-medium text-primary underline-offset-2 hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            /u/{profile.username}
          </Link>{" "}
          <span className="text-muted-foreground/90">(видна без входа, если аккаунт ACTIVE)</span>
        </p>
      ) : (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Укажите username, чтобы получить публичную страницу портфолио.
        </p>
      )}
      <ExecutorProfileForm
        initial={{
          displayName: profile.displayName,
          username: profile.username,
          phone: profile.phone,
          telegram: profile.telegram,
          city: profile.city,
          bio: profile.bio,
          accountStatus: profile.accountStatus,
          avatarUrl: profile.avatarUrl,
        }}
      />
      <MarketingSubscriptionCard
        initialEnabled={Boolean(prefs?.marketingOptIn)}
        initialEnabledAtIso={prefs?.marketingOptInAt?.toISOString() ?? null}
      />
      <ReferralCard
        link={referralLink}
        history={referralHistory}
        totalEarnedRubles={referralTotalRubles}
      />
      <ProfileReviewsSection stats={stats} reviews={receivedReviews} mode="full" />
    </div>
  );
}
