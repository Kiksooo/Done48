"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { createReviewAction } from "@/server/actions/reviews";
import { StarRatingDisplay } from "@/components/reviews/star-rating";
import { StarRatingInput } from "@/components/reviews/star-rating-input";

export type OrderReviewRow = {
  id: string;
  rating: number;
  text: string | null;
  createdAt: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
};

type Props = {
  orderId: string;
  /** Оставить отзыв контрагенту */
  reviewTarget: { toUserId: string; label: string } | null;
  alreadyReviewed: boolean;
  reviews: OrderReviewRow[];
};

export function OrderReviewsSection({ orderId, reviewTarget, alreadyReviewed, reviews }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const pendingReviewTarget = reviewTarget && !alreadyReviewed ? reviewTarget : null;

  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
      <h2 className="text-sm font-semibold">Отзывы и рейтинг</h2>
      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
        После приёмки работы стороны могут оценить друг друга по этому заказу. Один отзыв от участника на заказ.
      </p>

      {pendingReviewTarget ? (
        <form
          className="mt-4 space-y-3 border-t border-neutral-100 pt-4 dark:border-neutral-900"
          onSubmit={(e) => {
            e.preventDefault();
            const target = pendingReviewTarget;
            setMsg(null);
            startTransition(async () => {
              const r = await createReviewAction({
                orderId,
                toUserId: target.toUserId,
                rating,
                text: text || undefined,
              });
              if (!r.ok) {
                setMsg(r.error ?? "Ошибка");
                return;
              }
              setText("");
              router.refresh();
            });
          }}
        >
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
            Ваш отзыв {pendingReviewTarget.label}
          </p>
          <StarRatingInput value={rating} onChange={setRating} disabled={pending} />
          <Textarea
            placeholder="Комментарий (по желанию)"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={pending}
            className="min-h-[88px]"
          />
          {msg ? (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {msg}
            </p>
          ) : null}
          <Button type="submit" size="sm" disabled={pending}>
            Отправить отзыв
          </Button>
        </form>
      ) : null}

      {alreadyReviewed && reviewTarget ? (
        <p className="mt-4 text-sm text-emerald-800 dark:text-emerald-200">Вы уже оставили отзыв по этому заказу.</p>
      ) : null}

      <ul className="mt-4 space-y-4 border-t border-neutral-100 pt-4 dark:border-neutral-900">
        {reviews.length === 0 ? (
          <li className="text-sm text-neutral-500">Пока нет отзывов по этому заказу.</li>
        ) : (
          reviews.map((rev) => (
            <li key={rev.id} className="flex gap-3 text-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-neutral-200 bg-neutral-100 text-xs font-medium dark:border-neutral-700 dark:bg-neutral-900">
                {rev.reviewerAvatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={rev.reviewerAvatarUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  rev.reviewerName.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">{rev.reviewerName}</span>
                  <StarRatingDisplay value={rev.rating} />
                  <time className="text-xs text-neutral-500" dateTime={rev.createdAt}>
                    {new Date(rev.createdAt).toLocaleDateString("ru-RU")}
                  </time>
                </div>
                {rev.text ? (
                  <p className="mt-1 whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{rev.text}</p>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
