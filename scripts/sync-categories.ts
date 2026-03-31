import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CATEGORIES = [
  {
    name: "Дизайн",
    slug: "design",
    sortOrder: 10,
    subcategories: [
      { name: "UI/UX", slug: "ui", sortOrder: 1 },
      { name: "Логотип и фирстиль", slug: "brand", sortOrder: 2 },
      { name: "Баннеры и креативы", slug: "banners", sortOrder: 3 },
    ],
  },
  {
    name: "Разработка",
    slug: "development",
    sortOrder: 20,
    subcategories: [
      { name: "Сайты и лендинги", slug: "web", sortOrder: 1 },
      { name: "API и интеграции", slug: "api", sortOrder: 2 },
      { name: "Боты и автоматизация", slug: "automation", sortOrder: 3 },
    ],
  },
  {
    name: "Маркетинг и SMM",
    slug: "marketing",
    sortOrder: 30,
    subcategories: [
      { name: "Таргет и реклама", slug: "ads", sortOrder: 1 },
      { name: "Контент-план и SMM", slug: "smm", sortOrder: 2 },
      { name: "SEO и аналитика", slug: "seo", sortOrder: 3 },
    ],
  },
  {
    name: "Тексты и перевод",
    slug: "content",
    sortOrder: 40,
    subcategories: [
      { name: "Копирайтинг", slug: "copywriting", sortOrder: 1 },
      { name: "Редактура", slug: "editing", sortOrder: 2 },
      { name: "Переводы", slug: "translation", sortOrder: 3 },
    ],
  },
  {
    name: "Бытовые услуги",
    slug: "home-services",
    sortOrder: 50,
    subcategories: [
      { name: "Уборка", slug: "cleaning", sortOrder: 1 },
      { name: "Сантехнические работы", slug: "plumbing", sortOrder: 2 },
      { name: "Электрика", slug: "electricity", sortOrder: 3 },
      { name: "Сборка мебели", slug: "furniture-assembly", sortOrder: 4 },
    ],
  },
] as const;

async function main() {
  for (const category of CATEGORIES) {
    const cat = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
      },
    });

    for (const sub of category.subcategories) {
      await prisma.subcategory.upsert({
        where: { categoryId_slug: { categoryId: cat.id, slug: sub.slug } },
        create: {
          categoryId: cat.id,
          name: sub.name,
          slug: sub.slug,
          sortOrder: sub.sortOrder,
        },
        update: {
          name: sub.name,
          sortOrder: sub.sortOrder,
        },
      });
    }
  }

  // Прячем тестовые категории из выбора заказа, но не трогаем привязанные заказы.
  await prisma.category.updateMany({
    where: {
      OR: [{ name: "Vitest" }, { slug: { startsWith: "vitest-" } }],
    },
    data: { sortOrder: 9999 },
  });

  console.log("Categories synced.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

