"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  createPortfolioItemAction,
  deletePortfolioItemAction,
  updatePortfolioItemAction,
} from "@/server/actions/portfolio";
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
          Ссылки — только <code className="text-xs">http://</code> или <code className="text-xs">https://</code>
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
          <div className="space-y-2">
            <Label htmlFor="pf-i">URL картинки (опц.)</Label>
            <Input id="pf-i" value={nImg} onChange={(e) => setNImg(e.target.value)} disabled={pending} />
          </div>
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
  }, [item.title, item.description, item.imageUrl, item.linkUrl]);

  return (
    <li className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/20">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label>Название</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Описание</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label>URL картинки</Label>
          <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-2">
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
