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
    name: "Строительство и ремонт",
    slug: "construction",
    sortOrder: 45,
    subcategories: [
      { name: "Ремонт квартир и домов", slug: "renovation", sortOrder: 1 },
      { name: "Отделочные работы", slug: "finishing", sortOrder: 2 },
      { name: "Монтаж (окна, двери, перегородки)", slug: "installation-build", sortOrder: 3 },
      { name: "Кровля, фасады, утепление", slug: "roofing-facade", sortOrder: 4 },
      { name: "Демонтаж и подготовка", slug: "demolition-prep", sortOrder: 5 },
    ],
  },
  {
    name: "Красота и здоровье",
    slug: "beauty-health",
    sortOrder: 48,
    subcategories: [
      { name: "Парикмахер и стилист", slug: "hair", sortOrder: 1 },
      { name: "Маникюр и педикюр", slug: "nails", sortOrder: 2 },
      { name: "Массаж и wellness", slug: "massage", sortOrder: 3 },
      { name: "Косметология и уход", slug: "cosmetology", sortOrder: 4 },
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
  {
    name: "Переезды и логистика",
    slug: "moving-logistics",
    sortOrder: 55,
    subcategories: [
      { name: "Квартирный и офисный переезд", slug: "moving", sortOrder: 1 },
      { name: "Грузчики", slug: "loaders", sortOrder: 2 },
      { name: "Доставка и перевозка груза", slug: "cargo-delivery", sortOrder: 3 },
      { name: "Упаковка и хранение", slug: "packing-storage", sortOrder: 4 },
    ],
  },
  {
    name: "Фото и видео",
    slug: "photo-video",
    sortOrder: 60,
    subcategories: [
      { name: "Фотосъёмка", slug: "photography", sortOrder: 1 },
      { name: "Видеосъёмка и монтаж", slug: "videography", sortOrder: 2 },
      { name: "Обработка и ретушь", slug: "retouch", sortOrder: 3 },
      { name: "Предметная и рекламная съёмка", slug: "product-photo", sortOrder: 4 },
    ],
  },
  {
    name: "Образование и консультации",
    slug: "education",
    sortOrder: 65,
    subcategories: [
      { name: "Репетиторство", slug: "tutoring", sortOrder: 1 },
      { name: "Курсы и тренинги", slug: "courses", sortOrder: 2 },
      { name: "Подготовка к экзаменам", slug: "exam-prep", sortOrder: 3 },
      { name: "Бизнес- и карьерные консультации", slug: "career-consulting", sortOrder: 4 },
    ],
  },
  {
    name: "Юридические и финансовые услуги",
    slug: "legal-finance",
    sortOrder: 70,
    subcategories: [
      { name: "Юридические консультации", slug: "legal-consult", sortOrder: 1 },
      { name: "Документы и договоры", slug: "documents", sortOrder: 2 },
      { name: "Бухгалтерия и налоги", slug: "accounting", sortOrder: 3 },
      { name: "Регистрация бизнеса", slug: "business-registration", sortOrder: 4 },
    ],
  },
  {
    name: "Автоуслуги",
    slug: "automotive",
    sortOrder: 75,
    subcategories: [
      { name: "Ремонт и диагностика", slug: "car-repair", sortOrder: 1 },
      { name: "Шины и сезонная смена", slug: "tires", sortOrder: 2 },
      { name: "Детейлинг и химчистка", slug: "detailing", sortOrder: 3 },
      { name: "Эвакуация и техпомощь", slug: "roadside", sortOrder: 4 },
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

