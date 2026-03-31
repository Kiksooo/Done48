import { CabinetPageHeader } from "@/components/cabinet/cabinet-page-header";
import { ExecutorPortfolioPanel } from "@/components/portfolio/executor-portfolio-panel";
import { getSessionUserForAction } from "@/lib/rbac";
import { listPortfolioItemsForExecutor } from "@/server/queries/portfolio";
import { redirect } from "next/navigation";

export default async function ExecutorPortfolioPage() {
  const user = await getSessionUserForAction();
  if (!user) redirect("/login");

  const items = await listPortfolioItemsForExecutor(user.id);
  const initial = items.map((i) => ({
    id: i.id,
    title: i.title,
    description: i.description,
    imageUrl: i.imageUrl,
    linkUrl: i.linkUrl,
  }));

  return (
    <div className="space-y-6">
      <CabinetPageHeader
        breadcrumbs={[
          { label: "Дашборд", href: "/executor" },
          { label: "Портфолио" },
        ]}
        title="Портфолио"
        description={
          <>
            Примеры работ с http(s) ссылками. Изменения попадают в журнал аудита и обновляют публичную страницу{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">/u/your-username</code> (при активном аккаунте и
            заданном username в профиле).
          </>
        }
      />
      <ExecutorPortfolioPanel initial={initial} />
    </div>
  );
}
