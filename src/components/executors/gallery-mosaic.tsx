export type GalleryMosaicItem = { id: string; imageUrl: string | null };

/** Превью работ в карточке каталога / ленты. */
export function GalleryMosaic({ items }: { items: GalleryMosaicItem[] }) {
  const withUrl = items.filter((i): i is { id: string; imageUrl: string } => Boolean(i.imageUrl));
  if (withUrl.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-b from-muted/50 to-muted/20 px-3 text-center">
        <span className="text-3xl opacity-70" aria-hidden>
          🖼
        </span>
        <p className="text-xs font-medium leading-snug text-muted-foreground">Пока нет одобренных фото</p>
        <p className="text-[10px] leading-tight text-muted-foreground/80">после модерации появятся здесь</p>
      </div>
    );
  }
  if (withUrl.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={withUrl[0].imageUrl}
        alt=""
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }
  if (withUrl.length === 2) {
    return (
      <div className="grid h-full grid-cols-2 gap-px bg-border">
        {withUrl.map((x) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={x.id} src={x.imageUrl} alt="" className="h-full min-h-0 w-full object-cover" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid h-full grid-cols-2 grid-rows-2 gap-px bg-border">
      {withUrl.slice(0, 4).map((x) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={x.id} src={x.imageUrl} alt="" className="h-full min-h-0 w-full object-cover" />
      ))}
      {withUrl.length === 3 ? <span className="min-h-0 bg-muted/40" aria-hidden /> : null}
    </div>
  );
}
