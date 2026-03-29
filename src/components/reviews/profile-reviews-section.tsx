import { StarRatingDisplay } from "@/components/reviews/star-rating";
import { reviewerAvatarUrl, reviewerDisplayName } from "@/lib/review-display";
import type { ReviewWithFrom } from "@/server/queries/reviews";

export function ProfileReviewsSection(props: {
  stats: { avg: number | null; count: number };
  reviews: ReviewWithFrom[];
  mode: "full" | "anonymous_role";
  /** Заголовок блока (на публичной странице — нейтральный) */
  title?: string;
}) {
  const { stats, reviews, mode, title = "Отзывы о вас" } = props;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-sm font-semibold">{title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        {stats.count > 0 && stats.avg != null ? (
          <>
            <StarRatingDisplay value={Math.round(stats.avg)} />
            <span className="text-lg font-semibold tabular-nums">{stats.avg.toFixed(1)}</span>
            <span className="text-sm text-neutral-500">· {stats.count} оценок</span>
          </>
        ) : (
          <p className="text-sm text-neutral-500">Пока нет оценок от контрагентов.</p>
        )}
      </div>
      {reviews.length === 0 ? (
        <p className="mt-4 border-t border-neutral-100 pt-4 text-sm text-neutral-500 dark:border-neutral-900">
          Список отзывов пуст.
        </p>
      ) : (
        <ul className="mt-4 space-y-4 border-t border-neutral-100 pt-4 dark:border-neutral-900">
        {reviews.map((rev) => {
          const name = reviewerDisplayName(rev.fromUser, mode);
          const av = mode === "anonymous_role" ? null : reviewerAvatarUrl(rev.fromUser);
          return (
            <li key={rev.id} className="flex gap-3 text-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-900">
                {av ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={av} alt="" className="h-full w-full object-cover" />
                ) : (
                  name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{name}</span>
                  <StarRatingDisplay value={rev.rating} />
                  <time className="text-xs text-neutral-500" dateTime={rev.createdAt.toISOString()}>
                    {rev.createdAt.toLocaleDateString("ru-RU")}
                  </time>
                </div>
                {rev.text ? (
                  <p className="mt-1 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{rev.text}</p>
                ) : null}
              </div>
            </li>
          );
        })}
        </ul>
      )}
    </section>
  );
}
