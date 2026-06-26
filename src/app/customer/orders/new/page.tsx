import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { SERVICE_CTA_LEAVE_TASK } from "@/lib/brand-copy";
import { getAntifraudPlatformSettings } from "@/lib/platform-antifraud";
import { listCategoriesWithSubcategories } from "@/server/queries/categories";
import { OrderCreateForm, type CategoryOption } from "./order-create-form";

export default async function CustomerNewOrderPage() {
  const [af, raw] = await Promise.all([
    getAntifraudPlatformSettings(),
    listCategoriesWithSubcategories(),
  ]);
  const categories: CategoryOption[] = raw.map((c) => ({
    id: c.id,
    name: c.name,
    subcategories: c.subcategories.map((s) => ({ id: s.id, name: s.name })),
  }));

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/customer" },
          { label: "Мои заказы", href: "/customer/orders" },
          { label: SERVICE_CTA_LEAVE_TASK },
        ]}
        title={SERVICE_CTA_LEAVE_TASK}
        description="Опишите задачу — сервис подберёт исполнителя и выполнит работу в течение 48 часов."
      />
      <OrderCreateForm categories={categories} moderateAllNewOrders={af.moderateAllNewOrders} />
    </div>
  );
}
