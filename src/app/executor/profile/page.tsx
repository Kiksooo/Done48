import Link from "next/link";
import { ExecutorProfileForm } from "@/components/profile/executor-profile-form";
import { ProfileReviewsSection } from "@/components/reviews/profile-reviews-section";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { getReviewStatsForUser, listReviewsReceivedByUser } from "@/server/queries/reviews";

export default async function ExecutorProfilePage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const [profile, stats, receivedReviews] = await Promise.all([
    prisma.executorProfile.findUnique({ where: { userId: user.id } }),
    getReviewStatsForUser(user.id),
    listReviewsReceivedByUser(user.id, 40),
  ]);

  if (!profile) {
    return <p className="text-sm text-neutral-600">Профиль не найден.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Профиль и верификация</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Публичные поля профиля. Загрузка документов для верификации — в следующей итерации.
        </p>
        {profile.username ? (
          <p className="mt-2 text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Публичная страница: </span>
            <Link
              href={`/u/${profile.username}`}
              className="font-mono text-neutral-900 underline dark:text-neutral-100"
              target="_blank"
              rel="noreferrer"
            >
              /u/{profile.username}
            </Link>
            <span className="text-neutral-500"> (видна без входа, если аккаунт ACTIVE)</span>
          </p>
        ) : (
          <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
            Укажите username, чтобы получить публичную страницу портфолио.
          </p>
        )}
      </div>
      <ExecutorProfileForm
        initial={{
          displayName: profile.displayName,
          username: profile.username,
          phone: profile.phone,
          telegram: profile.telegram,
          city: profile.city,
          bio: profile.bio,
          accountStatus: profile.accountStatus,
          verificationStatus: profile.verificationStatus,
          avatarUrl: profile.avatarUrl,
        }}
      />
      <ProfileReviewsSection stats={stats} reviews={receivedReviews} mode="full" />
    </div>
  );
}
