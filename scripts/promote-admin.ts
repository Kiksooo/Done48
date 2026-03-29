/**
 * Выдать роль ADMIN существующему пользователю по email (пароль не меняется).
 * Запуск: npm run db:promote-admin -- your@email.com
 */
import { PrismaClient, Role } from "@prisma/client";

const email = (process.argv[2] ?? "").trim().toLowerCase();

const prisma = new PrismaClient();

async function main() {
  if (!email) {
    console.error("Укажите email: npm run db:promote-admin -- user@example.com");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    console.error(`Пользователь не найден: ${email}`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { email },
    data: {
      role: Role.ADMIN,
      onboardingDone: true,
      isActive: true,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: existing.id },
    create: { userId: existing.id, displayName: existing.email.split("@")[0] ?? "Админ" },
    update: {},
  });

  console.log(`Готово: ${email} → ADMIN. Выйдите из аккаунта и войдите снова, чтобы обновилась сессия.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
