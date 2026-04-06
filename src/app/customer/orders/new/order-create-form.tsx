"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BudgetType, VisibilityType } from "@prisma/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddressAutocompleteInput } from "@/components/maps/address-autocomplete-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_MAP_LAT, DEFAULT_MAP_LNG } from "@/lib/geo-defaults";
import { createOrderSchema, type CreateOrderInput } from "@/schemas/order";
import { createOrderAction } from "@/server/actions/orders/create-order";

const WorkLocationPicker = dynamic(
  () =>
    import("@/components/maps/work-location-picker").then((m) => ({
      default: m.WorkLocationPicker,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] animate-pulse rounded-lg bg-neutral-100 dark:bg-neutral-800" />
    ),
  },
);

export type CategoryOption = {
  id: string;
  name: string;
  subcategories: { id: string; name: string }[];
};

export function OrderCreateForm({
  categories,
  moderateAllNewOrders,
}: {
  categories: CategoryOption[];
  moderateAllNewOrders: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: categories[0]?.id ?? "",
      subcategoryId: "",
      budgetRubles: 1000,
      budgetType: BudgetType.FIXED,
      deadlineAt: "",
      urgency: false,
      visibilityType: VisibilityType.OPEN_FOR_RESPONSES,
      executorRequirements: "",
      initialStatus: moderateAllNewOrders ? "ON_MODERATION" : "NEW",
      isOfflineWork: false,
      workAddress: "",
      workLat: undefined,
      workLng: undefined,
    },
  });

  const categoryId = form.watch("categoryId");
  const isOfflineWork = form.watch("isOfflineWork");
  const workLat = form.watch("workLat");
  const workLng = form.watch("workLng");
  const workAddress = form.watch("workAddress");
  const [isGeocodingAddress, setIsGeocodingAddress] = useState(false);
  const [addressGeoHint, setAddressGeoHint] = useState<string | null>(null);
  const [mapLocatePulse, setMapLocatePulse] = useState(0);
  const addressReqSeqRef = useRef(0);

  const subs = useMemo(() => {
    const c = categories.find((x) => x.id === categoryId);
    return c?.subcategories ?? [];
  }, [categories, categoryId]);

  useEffect(() => {
    form.setValue("subcategoryId", "");
  }, [categoryId, form]);

  useEffect(() => {
    if (moderateAllNewOrders) {
      form.setValue("initialStatus", "ON_MODERATION");
    }
  }, [moderateAllNewOrders, form]);

  useEffect(() => {
    if (!isOfflineWork) {
      setIsGeocodingAddress(false);
      setAddressGeoHint(null);
      setMapLocatePulse(0);
      return;
    }

    const addr = (workAddress ?? "").trim();
    if (addr.length < 6) {
      setIsGeocodingAddress(false);
      setAddressGeoHint(null);
      return;
    }

    const reqSeq = ++addressReqSeqRef.current;
    const timer = window.setTimeout(async () => {
      try {
        setIsGeocodingAddress(true);
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(addr)}&limit=1`);
        if (!res.ok) throw new Error("geocode failed");
        const body = (await res.json()) as { results: Array<{ displayName: string; lat: number; lng: number }> };
        if (addressReqSeqRef.current !== reqSeq) return;
        const first = body.results?.[0];
        if (!first) {
          setAddressGeoHint("Адрес не найден, уточните формулировку или поставьте точку вручную.");
          return;
        }
        const lat = first.lat;
        const lng = first.lng;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          setAddressGeoHint("Не удалось распознать координаты, поставьте точку вручную.");
          return;
        }
        form.setValue("workLat", lat, { shouldValidate: true });
        form.setValue("workLng", lng, { shouldValidate: true });
        setMapLocatePulse((p) => p + 1);
        setAddressGeoHint("Точка на карте обновлена по адресу.");
      } catch {
        if (addressReqSeqRef.current !== reqSeq) return;
        setAddressGeoHint("Не удалось определить адрес автоматически. Поставьте точку на карте.");
      } finally {
        if (addressReqSeqRef.current === reqSeq) {
          setIsGeocodingAddress(false);
        }
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, isOfflineWork, workAddress]);

  function onSubmit(values: CreateOrderInput) {
    startTransition(async () => {
      const res = await createOrderAction(values);
      if (res.ok && res.data) {
        router.push(`/orders/${res.data.orderId}`);
        router.refresh();
        return;
      }
      form.setError("root", { message: res.ok ? "Ошибка" : res.error });
    });
  }

  if (categories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет категорий</CardTitle>
          <CardDescription>
            Администратор должен добавить категории в базе. Выполните{" "}
            <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-900">npm run db:seed</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/customer/orders">Назад</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый заказ</CardTitle>
        <CardDescription>Заполните поля — заказ появится в системе со статусом «Новый» или «На модерации».</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {form.formState.errors.root && (
            <p className="text-sm text-red-600" role="alert">
              {form.formState.errors.root.message}
            </p>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input id="title" {...form.register("title")} />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Описание</Label>
            <Textarea id="description" {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Категория</Label>
              <select
                id="categoryId"
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                {...form.register("categoryId")}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategoryId">Подкатегория</Label>
              <select
                id="subcategoryId"
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                {...form.register("subcategoryId")}
              >
                <option value="">—</option>
                {subs.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budgetRubles">Бюджет (₽)</Label>
              <Input id="budgetRubles" type="number" min={1} step={1} {...form.register("budgetRubles", { valueAsNumber: true })} />
              {form.formState.errors.budgetRubles && (
                <p className="text-sm text-red-600">{form.formState.errors.budgetRubles.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budgetType">Тип бюджета</Label>
              <select
                id="budgetType"
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                {...form.register("budgetType")}
              >
                <option value={BudgetType.FIXED}>Фикс</option>
                <option value={BudgetType.HOURLY}>Почасовой</option>
                <option value={BudgetType.BY_OFFER}>По предложению</option>
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="deadlineAt">Дедлайн</Label>
              <Input id="deadlineAt" type="datetime-local" {...form.register("deadlineAt")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibilityType">Доступ для специалистов</Label>
              <select
                id="visibilityType"
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                {...form.register("visibilityType")}
              >
                <option value={VisibilityType.OPEN_FOR_RESPONSES}>Открыт для откликов</option>
                <option value={VisibilityType.PLATFORM_ASSIGN}>Только подбор платформой</option>
              </select>
            </div>
          </div>
          {moderateAllNewOrders ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
              Новые заказы проходят проверку модератором перед публикацией для специалистов.
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="initialStatus">Стартовый статус</Label>
              <select
                id="initialStatus"
                className="flex h-10 w-full rounded-md border border-neutral-300 bg-transparent px-3 text-sm dark:border-neutral-700"
                {...form.register("initialStatus")}
              >
                <option value="NEW">Новый</option>
                <option value="ON_MODERATION">На модерации</option>
              </select>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input id="urgency" type="checkbox" className="h-4 w-4 rounded border-neutral-300" {...form.register("urgency")} />
            <Label htmlFor="urgency" className="font-normal">
              Срочный заказ
            </Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="executorRequirements">Требования к специалисту</Label>
            <Textarea id="executorRequirements" {...form.register("executorRequirements")} />
          </div>

          <div className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <div className="flex items-start gap-2">
              <input
                id="isOfflineWork"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300"
                checked={isOfflineWork}
                onChange={(e) => {
                  const v = e.target.checked;
                  form.setValue("isOfflineWork", v, { shouldValidate: true });
                  if (v) {
                    const lat = form.getValues("workLat");
                    const lng = form.getValues("workLng");
                    if (lat == null || lng == null) {
                      form.setValue("workLat", DEFAULT_MAP_LAT, { shouldValidate: true });
                      form.setValue("workLng", DEFAULT_MAP_LNG, { shouldValidate: true });
                    }
                  } else {
                    form.setValue("workLat", undefined, { shouldValidate: true });
                    form.setValue("workLng", undefined, { shouldValidate: true });
                    form.setValue("workAddress", "", { shouldValidate: true });
                  }
                }}
              />
              <div>
                <Label htmlFor="isOfflineWork" className="font-medium">
                  Задача с выездом (офлайн)
                </Label>
                <p className="mt-1 text-xs text-neutral-500">
                  Укажите на карте, где нужно выполнить работу или встретиться — так специалисту проще оценить
                  логистику.
                </p>
              </div>
            </div>
            {isOfflineWork ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="workAddress">Адрес или ориентир (необязательно)</Label>
                  <Controller
                    name="workAddress"
                    control={form.control}
                    render={({ field }) => (
                      <AddressAutocompleteInput
                        id="workAddress"
                        name={field.name}
                        placeholder="Начните вводить улицу или район — подсказки из России"
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        onChange={(v) => field.onChange(v)}
                        ref={field.ref}
                        onPick={(hit) => {
                          form.setValue("workLat", hit.lat, { shouldValidate: true });
                          form.setValue("workLng", hit.lng, { shouldValidate: true });
                          setMapLocatePulse((p) => p + 1);
                          setAddressGeoHint("Адрес выбран из подсказок — точка на карте обновлена.");
                        }}
                      />
                    )}
                  />
                  {isGeocodingAddress ? (
                    <p className="text-xs text-neutral-500">Ищем адрес на карте…</p>
                  ) : addressGeoHint ? (
                    <p className="text-xs text-neutral-500">{addressGeoHint}</p>
                  ) : null}
                </div>
                {workLat != null && workLng != null ? (
                  <WorkLocationPicker
                    lat={workLat}
                    lng={workLng}
                    locatePulse={mapLocatePulse}
                    onChange={(lat, lng) => {
                      form.setValue("workLat", lat, { shouldValidate: true });
                      form.setValue("workLng", lng, { shouldValidate: true });
                    }}
                  />
                ) : null}
                {form.formState.errors.workLat ? (
                  <p className="text-sm text-red-600" role="alert">
                    {form.formState.errors.workLat.message}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "Создание…" : "Создать заказ"}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/customer/orders">Отмена</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
