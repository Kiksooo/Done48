import {
  CategoriesAdminPanel,
  type CategoryAdminRow,
} from "@/components/admin/categories-admin-panel";
import { listCategoriesForAdmin } from "@/server/queries/categories";

export default async function AdminCategoriesPage() {
  const rows = await listCategoriesForAdmin();

  const initial: CategoryAdminRow[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    sortOrder: c.sortOrder,
    orderCount: c._count.orders,
    subcategories: c.subcategories.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      sortOrder: s.sortOrder,
      orderCount: s._count.orders,
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Категории</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Категории и подкатегории используются при создании заказа. Удаление возможно, только если нет
          привязанных заказов.
        </p>
      </div>
      <CategoriesAdminPanel initial={initial} />
    </div>
  );
}
