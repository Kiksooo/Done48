"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  adminCreateCategoryAction,
  adminCreateSubcategoryAction,
  adminDeleteCategoryAction,
  adminDeleteSubcategoryAction,
  adminUpdateCategoryAction,
  adminUpdateSubcategoryAction,
} from "@/server/actions/admin-categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type CategoryAdminRow = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  orderCount: number;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    orderCount: number;
  }[];
};

export function CategoriesAdminPanel({ initial }: { initial: CategoryAdminRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatSort, setNewCatSort] = useState("0");

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setMsg(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) {
        setMsg(r.error ?? "Ошибка");
        return;
      }
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
        <h2 className="text-lg font-semibold">Новая категория</h2>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Slug — латиница в нижнем регистре, через дефис (например <code className="text-xs">web-dev</code>).
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="nc-name">Название</Label>
            <Input
              id="nc-name"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-slug">Slug</Label>
            <Input
              id="nc-slug"
              value={newCatSlug}
              onChange={(e) => setNewCatSlug(e.target.value.toLowerCase())}
              disabled={pending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nc-sort">Порядок</Label>
            <Input
              id="nc-sort"
              type="number"
              value={newCatSort}
              onChange={(e) => setNewCatSort(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
        <Button
          type="button"
          className="mt-4"
          disabled={pending}
          onClick={() =>
            run(() =>
              adminCreateCategoryAction({
                name: newCatName,
                slug: newCatSlug,
                sortOrder: Number(newCatSort),
              }),
            )
          }
        >
          Создать категорию
        </Button>
      </section>

      <div className="space-y-6">
        {initial.map((cat) => (
          <CategoryBlock
            key={cat.id}
            cat={cat}
            pending={pending}
            onRun={run}
          />
        ))}
      </div>
    </div>
  );
}

function CategoryBlock({
  cat,
  pending,
  onRun,
}: {
  cat: CategoryAdminRow;
  pending: boolean;
  onRun: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [name, setName] = useState(cat.name);
  const [slug, setSlug] = useState(cat.slug);
  const [sortOrder, setSortOrder] = useState(String(cat.sortOrder));

  useEffect(() => {
    setName(cat.name);
    setSlug(cat.slug);
    setSortOrder(String(cat.sortOrder));
  }, [cat.name, cat.slug, cat.sortOrder]);

  const [subName, setSubName] = useState("");
  const [subSlug, setSubSlug] = useState("");
  const [subSort, setSubSort] = useState("0");

  return (
    <section className="rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">{cat.name}</h3>
          <p className="text-xs text-neutral-500">
            Заказов в категории: {cat.orderCount}
            {cat.orderCount > 0 ? " · удаление недоступно" : ""}
          </p>
        </div>
        {cat.orderCount === 0 ? (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() => {
              if (!confirm(`Удалить категорию «${cat.name}» и все подкатегории?`)) return;
              onRun(() => adminDeleteCategoryAction({ id: cat.id }));
            }}
          >
            Удалить категорию
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-4">
        <div className="space-y-1 sm:col-span-2">
          <Label className="text-xs">Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} disabled={pending} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Порядок</Label>
          <Input
            type="number"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            disabled={pending}
          />
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        disabled={pending}
        onClick={() =>
          onRun(() =>
            adminUpdateCategoryAction({
              id: cat.id,
              name,
              slug,
              sortOrder: Number(sortOrder),
            }),
          )
        }
      >
        Сохранить категорию
      </Button>

      <div className="mt-6 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <h4 className="text-sm font-medium">Подкатегории</h4>
        <ul className="mt-3 space-y-4">
          {cat.subcategories.map((sub) => (
            <SubcategoryRow key={sub.id} sub={sub} pending={pending} onRun={onRun} />
          ))}
        </ul>

        <div className="mt-4 rounded-md border border-dashed border-neutral-300 p-3 dark:border-neutral-700">
          <p className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Добавить подкатегорию</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-4">
            <Input
              placeholder="Название"
              value={subName}
              onChange={(e) => setSubName(e.target.value)}
              disabled={pending}
              className="sm:col-span-2"
            />
            <Input
              placeholder="slug"
              value={subSlug}
              onChange={(e) => setSubSlug(e.target.value.toLowerCase())}
              disabled={pending}
            />
            <Input
              type="number"
              placeholder="порядок"
              value={subSort}
              onChange={(e) => setSubSort(e.target.value)}
              disabled={pending}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="mt-2"
            disabled={pending}
            onClick={() =>
              onRun(() =>
                adminCreateSubcategoryAction({
                  categoryId: cat.id,
                  name: subName,
                  slug: subSlug,
                  sortOrder: Number(subSort),
                }),
              )
            }
          >
            Добавить
          </Button>
        </div>
      </div>
    </section>
  );
}

function SubcategoryRow({
  sub,
  pending,
  onRun,
}: {
  sub: CategoryAdminRow["subcategories"][number];
  pending: boolean;
  onRun: (fn: () => Promise<{ ok: boolean; error?: string }>) => void;
}) {
  const [name, setName] = useState(sub.name);
  const [slug, setSlug] = useState(sub.slug);
  const [sortOrder, setSortOrder] = useState(String(sub.sortOrder));

  useEffect(() => {
    setName(sub.name);
    setSlug(sub.slug);
    setSortOrder(String(sub.sortOrder));
  }, [sub.name, sub.slug, sub.sortOrder]);

  return (
    <li className="space-y-2 rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      {sub.orderCount > 0 ? (
        <p className="text-xs text-neutral-500">Заказов с этой подкатегорией: {sub.orderCount}</p>
      ) : null}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="grid flex-1 gap-2 sm:grid-cols-4">
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Название</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={pending} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} disabled={pending} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Порядок</Label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              disabled={pending}
            />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              onRun(() =>
                adminUpdateSubcategoryAction({
                  id: sub.id,
                  name,
                  slug,
                  sortOrder: Number(sortOrder),
                }),
              )
            }
          >
            Сохранить
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={pending || sub.orderCount > 0}
            title={sub.orderCount > 0 ? "Есть заказы с этой подкатегорией" : undefined}
            onClick={() => {
              if (!confirm(`Удалить подкатегорию «${sub.name}»?`)) return;
              onRun(() => adminDeleteSubcategoryAction({ id: sub.id }));
            }}
          >
            Удалить
          </Button>
        </div>
      </div>
    </li>
  );
}
