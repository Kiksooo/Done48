"use client";

import type { PortfolioItemModerationStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createPortfolioItemAction,
  deletePortfolioItemAction,
  updatePortfolioItemAction,
} from "@/server/actions/portfolio";
import { PortfolioImageField } from "@/components/portfolio/portfolio-image-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type PortfolioItemRow = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  moderationStatus: PortfolioItemModerationStatus;
  moderationNote: string | null;
};

const STATUS_RU: Record<PortfolioItemModerationStatus, string> = {
  PENDING: "На проверке",
  APPROVED: "В галерее",
  REJECTED: "Отклонено",
};

export function ExecutorPortfolioPanel({ initial }: { initial: PortfolioItemRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");
  const [nImg, setNImg] = useState("");
  const [nLink, setNLink] = useState("");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, onOk?: () => void) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setMsg(r.error ?? "Ошибка");
        return;
      }
      onOk?.();
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {msg ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {msg}
        </p>
      ) : null}

      <section className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
        <h2 className="text-lg font-semibold">Добавить работу</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Ссылка на кейс — только <code className="text-xs">http://</code> или <code className="text-xs">https://</code>.
          Фото публикуется на сайте после одобрения модератором.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="pf-t">Название</Label>
            <Input id="pf-t" value={nTitle} onChange={(e) => setNTitle(e.target.value)} disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pf-d">Описание</Label>
            <Textarea id="pf-d" value={nDesc} onChange={(e) => setNDesc(e.target.value)} disabled={pending} />
          </div>
          <PortfolioImageField value={nImg} onChange={setNImg} disabled={pending} idPrefix="pf-new" />
          <div className="space-y-2">
            <Label htmlFor="pf-l">Ссылка на кейс (опц.)</Label>
            <Input id="pf-l" value={nLink} onChange={(e) => setNLink(e.target.value)} disabled={pending} />
          </div>
          <Button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  createPortfolioItemAction({
                    title: nTitle,
                    description: nDesc,
                    imageUrl: nImg,
                    linkUrl: nLink,
                  }),
                () => {
                  setNTitle("");
                  setNDesc("");
                  setNImg("");
                  setNLink("");
                },
              )
            }
          >
            Добавить
          </Button>
        </div>
      </section>

      <ul className="space-y-6">
        {initial.map((item) => (
          <PortfolioItemEditor key={item.id} item={item} pending={pending} onRun={run} />
        ))}
      </ul>
    </div>
  );
}

function PortfolioItemEditor({
  item,
  pending,
  onRun,
}: {
  item: PortfolioItemRow;
  pending: boolean;
  onRun: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? "");
  const [imageUrl, setImageUrl] = useState(item.imageUrl ?? "");
  const [linkUrl, setLinkUrl] = useState(item.linkUrl ?? "");

  useEffect(() => {
    setTitle(item.title);
    setDescription(item.description ?? "");
    setImageUrl(item.imageUrl ?? "");
    setLinkUrl(item.linkUrl ?? "");
  }, [
    item.title,
    item.description,
    item.imageUrl,
    item.linkUrl,
    item.moderationStatus,
    item.moderationNote,
  ]);

  return (
    <li className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/20">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
            item.moderationStatus === "APPROVED"
              ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
              : item.moderationStatus === "REJECTED"
                ? "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200"
                : "bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-200"
          }`}
        >
          {STATUS_RU[item.moderationStatus]}
        </span>
      </div>
      {item.moderationStatus === "REJECTED" && item.moderationNote ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50/80 p-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Комментарий модератора: {item.moderationNote}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Название</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Описание</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <PortfolioImageField value={imageUrl} onChange={setImageUrl} disabled={pending} idPrefix={`pf-${item.id}`} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Ссылка на работу</Label>
          <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} disabled={pending} />
        </div>
      </div>
      {linkUrl.trim() ? (
        <p className="mt-2 text-xs">
          <Link
            href={linkUrl.trim()}
            className="text-neutral-600 underline dark:text-neutral-400"
            target="_blank"
            rel="noreferrer"
          >
            Открыть ссылку
          </Link>
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            onRun(() =>
              updatePortfolioItemAction({
                id: item.id,
                title,
                description,
                imageUrl,
                linkUrl,
              }),
            )
          }
        >
          Сохранить
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          disabled={pending}
          onClick={() => {
            if (!confirm("Удалить запись из портфолио?")) return;
            onRun(() => deletePortfolioItemAction({ id: item.id }));
          }}
        >
          Удалить
        </Button>
      </div>
    </li>
  );
}
