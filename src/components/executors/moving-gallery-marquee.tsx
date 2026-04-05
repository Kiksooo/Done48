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

/** Горизонтальных полос: на мобиле 3, с md — 4 */
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
  fillViewport,
}: {
  card: MovingGalleryCard;
  layout: "marquee" | "grid";
  fillViewport?: boolean;
}) {
  return (
    <Link
      href={`/u/${card.username}`}
      className={cn(
        "group overflow-hidden rounded-2xl border border-border/80 bg-card shadow-md",
        "transition-[box-shadow,transform,border-color] duration-200 ease-out",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background",
        layout === "marquee" && !fillViewport && "w-[8.5rem] shrink-0 sm:w-[9.25rem]",
        layout === "marquee" && fillViewport && "w-[var(--mg-card)] shrink-0 max-w-[min(46vw,11rem)]",
        layout === "grid" && "block w-full",
      )}
      aria-label={`Открыть профиль @${card.username}`}
    >
      <div className="aspect-square w-full overflow-hidden bg-muted">
        <GalleryMosaic items={card.portfolioItems} />
      </div>
      <p
        className={cn(
          "border-t border-border/80 bg-card/95 text-center font-mono font-semibold text-foreground backdrop-blur-sm",
          fillViewport ? "px-1.5 py-1.5 text-[10px] sm:py-2 sm:text-[11px]" : "px-2 py-2 text-[11px] sm:py-2.5 sm:text-xs",
        )}
      >
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
  staggerIndex,
  fillViewport,
}: {
  sequence: MovingGalleryCard[];
  reverse: boolean;
  slow: boolean;
  staggerIndex: number;
  fillViewport?: boolean;
}) {
  const loop = [...sequence, ...sequence];

  const animClass = reverse
    ? slow
      ? "animate-gallery-marquee-rev-slow"
      : "animate-gallery-marquee-rev"
    : slow
      ? "animate-gallery-marquee-slow"
      : "animate-gallery-marquee";

  const staggerSec = staggerIndex * 6.5;

  return (
    <div
      className={cn(
        "moving-gallery-track flex w-max gap-3 sm:gap-4 md:gap-5",
        fillViewport && "gap-2 sm:gap-3 md:gap-4",
        animClass,
        "hover:[animation-play-state:paused]",
      )}
      style={{
        animationDelay: staggerSec ? `${-staggerSec}s` : undefined,
      }}
    >
      {loop.map((card, i) => (
        <GalleryCardLink key={`${card.id}-${i}`} card={card} layout="marquee" fillViewport={fillViewport} />
      ))}
    </div>
  );
}

function StaticGalleryGrid({ cards, fillViewport }: { cards: MovingGalleryCard[]; fillViewport?: boolean }) {
  return (
    <ul
      className={cn(
        "gap-3 sm:gap-4",
        fillViewport
          ? "grid min-h-0 flex-1 auto-rows-[minmax(0,1fr)] grid-cols-2 content-center gap-3 p-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
          : "grid grid-cols-2 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4",
      )}
    >
      {cards.map((c) => (
        <li key={c.id}>
          <GalleryCardLink card={c} layout="grid" fillViewport={fillViewport} />
        </li>
      ))}
    </ul>
  );
}

type Props = {
  cards: MovingGalleryCard[];
  /** Ленты на всю высоту экрана (100dvh), строки делят высоту поровну */
  fillViewport?: boolean;
};

/**
 * 3–4 горизонтальные ленты на всю ширину; при fillViewport — на всю высоту окна.
 */
export function MovingGalleryMarquee({ cards, fillViewport }: Props) {
  const reduceMotion = usePrefersReducedMotion();
  const rowCount = useRowCount();
  const valid = cards.filter((c) => c.username);
  if (valid.length === 0) return null;

  if (reduceMotion) {
    return (
      <div
        className={cn(
          "space-y-3",
          fillViewport && "relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden",
        )}
      >
        {!fillViewport ? (
          <p className="text-center text-xs text-muted-foreground sm:text-sm">
            У вас включено снижение анимации — показываем сетку вместо движущейся ленты.
          </p>
        ) : (
          <p className="pointer-events-none absolute left-0 right-0 top-0 z-20 px-4 pt-3 text-center text-[11px] text-muted-foreground/90 sm:text-xs">
            Сетка вместо анимации — снижение движения в системе
          </p>
        )}
        <StaticGalleryGrid cards={valid} fillViewport={fillViewport} />
      </div>
    );
  }

  const buckets = splitIntoRows(valid, rowCount);
  const sequences = buckets.map((b) => buildLoopSequence(b.length ? b : valid));

  const gridStyle = fillViewport
    ? ({
        gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
        ["--mg-rows" as string]: String(rowCount),
        ["--mg-card" as string]:
          "min(calc((100dvh - 3.25rem) / var(--mg-rows) - 0.45rem), min(46vw, 11rem))",
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={cn(
        "flex flex-col",
        fillViewport && "relative h-[100dvh] max-h-[100dvh] flex flex-col overflow-hidden",
      )}
    >
      {!fillViewport ? (
        <p className="mx-auto mb-3 max-w-2xl text-center text-xs text-muted-foreground sm:text-sm">
          {rowCount} ленты на всю ширину экрана — наведите на полосу, чтобы остановить и открыть карточку
        </p>
      ) : (
        <p className="pointer-events-none absolute left-0 right-0 top-0 z-20 mx-auto max-w-xl px-4 pt-3 text-center text-[11px] text-muted-foreground/90 sm:text-xs">
          Наведите на ленту, чтобы остановить и открыть профиль
        </p>
      )}

      <div className={cn("overflow-x-clip", fillViewport && "flex min-h-0 flex-1 flex-col")}>
        <div
          className={cn(
            "relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2",
            fillViewport && "flex min-h-0 flex-1 flex-col",
          )}
        >
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background via-background/90 to-transparent sm:w-12 md:w-20"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background via-background/90 to-transparent sm:w-12 md:w-20"
            aria-hidden
          />

          <div
            className={cn(
              fillViewport
                ? "grid min-h-0 flex-1 gap-2 py-2 sm:gap-2.5 sm:py-3 md:py-4"
                : "flex flex-col gap-3 py-1 sm:gap-4 md:py-2",
            )}
            style={gridStyle}
          >
            {sequences.map((seq, idx) => {
              const preset = ROW_PRESETS[idx % ROW_PRESETS.length]!;
              return (
                <div
                  key={idx}
                  className={cn(
                    "flex min-h-0 items-center overflow-hidden",
                    fillViewport && "px-0.5",
                  )}
                >
                  <MarqueeTrack
                    sequence={seq}
                    reverse={preset.reverse}
                    slow={preset.slow}
                    staggerIndex={idx}
                    fillViewport={fillViewport}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
