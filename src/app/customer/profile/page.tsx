import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { CustomerProfileForm } from "@/components/profile/customer-profile-form";
import { ReferralCard } from "@/components/profile/referral-card";
import { ProfileReviewsSection } from "@/components/reviews/profile-reviews-section";
import { prisma } from "@/lib/db";
import { getSessionUserForAction } from "@/lib/rbac";
import { getSiteUrl } from "@/lib/site-url";
import { redirect } from "next/navigation";
import { getReviewStatsForUser, listReviewsReceivedByUser } from "@/server/queries/reviews";

export default async function CustomerProfilePage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const [profile, stats, receivedReviews] = await Promise.all([
    prisma.customerProfile.findUnique({ where: { userId: user.id } }),
    getReviewStatsForUser(user.id),
    listReviewsReceivedByUser(user.id, 40),
  ]);

  if (!profile) {
    return <p className="text-sm text-neutral-600">Профиль не найден.</p>;
  }

  const referralLink = `${getSiteUrl()}/register?ref=${encodeURIComponent(user.id)}`;

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Профиль" },
        ]}
        title="Профиль заказчика"
        description="Контактные данные и город — исполнители увидят их в карточке заказа."
      />
      <CustomerProfileForm
        initial={{
          displayName: profile.displayName,
          phone: profile.phone,
          telegram: profile.telegram,
          company: profile.company,
          city: profile.city,
          avatarUrl: profile.avatarUrl,
        }}
      />
      <ReferralCard link={referralLink} />
      <ProfileReviewsSection stats={stats} reviews={receivedReviews} mode="full" />
    </div>
  );
}
