import Link from "next/link";
import { getAntifraudPlatformSettings } from "@/lib/platform-antifraud";
import { listCategoriesWithSubcategories } from "@/server/queries/categories";
import { OrderCreateForm, type CategoryOption } from "./order-create-form";

export default async function CustomerNewOrderPage() {
  const af = await getAntifraudPlatformSettings();
  const raw = await listCategoriesWithSubcategories();
  const categories: CategoryOption[] = raw.map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/customer/orders"
          className="text-sm text-neutral-600 underline hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
        >
          ← Мои заказы
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Создать заказ</h1>
      </div>
      <OrderCreateForm categories={categories} moderateAllNewOrders={af.moderateAllNewOrders} />
    </div>
  );
}
