"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  idPrefix?: string;
};

export function PortfolioImageField({ value, onChange, disabled, idPrefix = "pf-img" }: Props) {
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/portfolio", { method: "POST", body: fd });
      const data: { url?: string; error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Ошибка загрузки");
      if (data.url) onChange(data.url);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Не удалось загрузить");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Label>Фото работы</Label>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        До 2 МБ, JPEG/PNG/WebP/GIF или ссылка https:// — после загрузки работа появится в профиле только после проверки модератором.
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            "flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-100 text-sm text-neutral-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            "Нет фото"
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <Input
            id={`${idPrefix}-url`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://… или /uploads/portfolio/…"
            disabled={disabled || uploading}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={disabled || uploading} asChild>
              <label className="cursor-pointer">
                {uploading ? "Загрузка…" : "Загрузить файл"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={onFileChange}
                  disabled={disabled || uploading}
                />
              </label>
            </Button>
            {value ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled || uploading}
                onClick={() => onChange("")}
              >
                Убрать
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      {err ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
