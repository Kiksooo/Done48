/**
 * Удаляет тестовые заказы из админки: Vitest и демо из seed (customer@demo.local).
 * Дочерние строки (отклики, чат и т.д.) снимает каскадом БД.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const where = {
    OR: [
      { title: "Vitest order" },
      {
        AND: [
          { title: { startsWith: "Демо:" } },
          { customer: { email: "customer@demo.local" } },
        ],
      },
    ],
  };

  const preview = await prisma.order.findMany({
    where,
    select: { id: true, title: true, publicId: true, customer: { select: { email: true } } },
  });

  if (preview.length === 0) {
    console.log("Подходящих заказов не найдено.");
    return;
  }

  console.log("Будут удалены заказы:");
  for (const o of preview) {
    console.log(`  ${o.id}  |  ${o.title}  |  ${o.customer.email}`);
  }

  const { count } = await prisma.order.deleteMany({ where });
  console.log(`Удалено записей Order: ${count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
