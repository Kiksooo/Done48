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
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Портфолио</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Примеры работ с http(s) ссылками. Изменения попадают в журнал аудита и обновляют публичную страницу{" "}
          <code className="text-xs">/u/your-username</code> (при активном аккаунте и заданном username в профиле).
        </p>
      </div>
      <ExecutorPortfolioPanel initial={initial} />
    </div>
  );
}
