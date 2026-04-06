import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
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
          { label: "Новый заказ" },
        ]}
        title="Создать заказ"
        description="Заполните поля — после публикации заказ увидят специалисты (при необходимости пройдёт модерацию)."
      />
      <OrderCreateForm categories={categories} moderateAllNewOrders={af.moderateAllNewOrders} />
    </div>
  );
}
