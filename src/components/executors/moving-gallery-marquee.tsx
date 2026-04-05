"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GalleryMosaic, type GalleryMosaicItem } from "@/components/executors/gallery-mosaic";
import { cn } from "@/lib/utils";

export type MovingGalleryCard = {
  id: string;
  username: string;
  portfolioItems: GalleryMosaicItem[];
};

/** Сколько горизонтальных полос: на мобиле 3, с md — 4 на всю ширину экрана */
const ROW_COUNT_SM = 3;
const ROW_COUNT_LG = 4;

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const onChange = () => setReduce(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduce;
}

function useRowCount(): number {
  const [n, setN] = useState(ROW_COUNT_LG);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const apply = () => setN(mq.matches ? ROW_COUNT_LG : ROW_COUNT_SM);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return n;
}

function GalleryCardLink({
  card,
  layout,
}: {
  card: MovingGalleryCard;
  layout: "marquee" | "grid";
}) {
  return (
    <Link
      href={`/u/${card.username}`}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md",
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        layout === "marquee" ? "w-[8.5rem] shrink-0 sm:w-[9.25rem]" : "block w-full",
      )}
      aria-label={`Открыть профиль @${card.username}`}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <GalleryMosaic items={card.portfolioItems} />
      </div>
      <p className="border-t border-border/80 bg-card/95 px-2 py-2 text-center font-mono text-[11px] font-semibold text-foreground backdrop-blur-sm sm:py-2.5 sm:text-xs">
        @{card.username}
      </p>
    </Link>
  );
}

function buildLoopSequence(items: MovingGalleryCard[]): MovingGalleryCard[] {
  if (items.length === 0) return [];
  const minSlots = 12;
  const copies = Math.max(2, Math.ceil(minSlots / items.length));
  return Array.from({ length: copies }, () => items).flat();
}

function splitIntoRows(items: MovingGalleryCard[], rowCount: number): MovingGalleryCard[][] {
  const rows: MovingGalleryCard[][] = Array.from({ length: rowCount }, () => []);
  items.forEach((c, i) => {
    rows[i % rowCount]!.push(c);
  });
  for (let r = 0; r < rowCount; r++) {
    if (rows[r]!.length === 0) {
      rows[r] = [...items];
    }
  }
  return rows;
}

const ROW_PRESETS: { reverse: boolean; slow: boolean }[] = [
  { reverse: false, slow: false },
  { reverse: true, slow: true },
  { reverse: false, slow: true },
  { reverse: true, slow: false },
];

function MarqueeTrack({
  sequence,
  reverse,
  slow,
}: {
  sequence: MovingGalleryCard[];
  reverse: boolean;
  slow: boolean;
}) {
  const loop = [...sequence, ...sequence];

  const animClass = reverse
    ? slow
      ? "animate-gallery-marquee-rev-slow"
      : "animate-gallery-marquee-rev"
    : slow
      ? "animate-gallery-marquee-slow"
      : "animate-gallery-marquee";

  return (
    <div
      className={cn(
        "moving-gallery-track flex w-max gap-3 sm:gap-4 md:gap-5",
        animClass,
        "hover:[animation-play-state:paused]",
      )}
    >
      {loop.map((card, i) => (
        <GalleryCardLink key={`${card.id}-${i}`} card={card} layout="marquee" />
      ))}
    </div>
  );
}

function StaticGalleryGrid({ cards }: { cards: MovingGalleryCard[] }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
      {cards.map((c) => (
        <li key={c.id}>
          <GalleryCardLink card={c} layout="grid" />
        </li>
      ))}
    </ul>
  );
}

type Props = {
  cards: MovingGalleryCard[];
};

/**
 * 3–4 горизонтальные ленты на всю ширину viewport, разные направления и скорости.
 */
export function MovingGalleryMarquee({ cards }: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const rowCount = useRowCount();
  const valid = cards.filter((c) => c.username);
  if (valid.length === 0) return null;

  if (reduceMotion) {
    return (
      <div className="space-y-3">
        <p className="text-center text-xs text-muted-foreground sm:text-sm">
          У вас включено снижение анимации — показываем сетку вместо движущейся ленты.
        </p>
        <StaticGalleryGrid cards={valid} />
      </div>
    );
  }

  const buckets = splitIntoRows(valid, rowCount);
  const sequences = buckets.map((b) => buildLoopSequence(b.length ? b : valid));

  return (
    <div className="space-y-3">
      <p className="mx-auto max-w-2xl text-center text-xs text-muted-foreground sm:text-sm">
        {rowCount} ленты на всю ширину экрана — наведите на полосу, чтобы остановить и открыть карточку
      </p>

      {/* full-bleed: на всю ширину окна, не только контейнер max-w-5xl */}
      <div className="overflow-x-clip">
        <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2">
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-background via-background/95 to-transparent sm:w-16 md:w-24"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-background via-background/95 to-transparent sm:w-16 md:w-24"
            aria-hidden
          />

          <div className="flex flex-col gap-3 py-1 sm:gap-4 md:py-2">
            {sequences.map((seq, idx) => {
              const preset = ROW_PRESETS[idx % ROW_PRESETS.length]!;
              return (
                <MarqueeTrack
                  key={idx}
                  sequence={seq}
                  reverse={preset.reverse}
                  slow={preset.slow}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
