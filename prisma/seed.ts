import {
  BudgetType,
  ExecutorAccountStatus,
  NotificationKind,
  OrderStatus,
  PaymentStatus,
  PrismaClient,
  Role,
  TransactionType,
  VisibilityType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { appendStatusHistory } from "../src/server/orders/status";

const prisma = new PrismaClient();

async function main() {
  await prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default" },
    update: {},
  });

  const categories = [
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

  const categoryBySlug = new Map<string, { id: string }>();
  for (const category of categories) {
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
    categoryBySlug.set(category.slug, { id: cat.id });

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

  const catDesign = categoryBySlug.get("design");
  const catDev = categoryBySlug.get("development");
  if (!catDesign || !catDev) {
    throw new Error("Seed categories not initialized");
  }
  const subWeb = await prisma.subcategory.findUniqueOrThrow({
    where: { categoryId_slug: { categoryId: catDev.id, slug: "web" } },
  });
  const subApi = await prisma.subcategory.findUniqueOrThrow({
    where: { categoryId_slug: { categoryId: catDev.id, slug: "api" } },
  });

  const passwordHash = await bcrypt.hash("demo12345", 12);
  const adminEmail = "admin@demo.local";
  const customerEmail = "customer@demo.local";
  const executorEmail = "executor@demo.local";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      role: Role.ADMIN,
      onboardingDone: true,
    },
    update: {
      passwordHash,
      onboardingDone: true,
      isActive: true,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, displayName: "Админ демо" },
    update: { displayName: "Админ демо" },
  });

  const ownerAdminEmail = "lidiiakik@gmail.com";
  const ownerAdmin = await prisma.user.upsert({
    where: { email: ownerAdminEmail },
    create: {
      email: ownerAdminEmail,
      passwordHash,
      role: Role.ADMIN,
      onboardingDone: true,
    },
    update: {
      role: Role.ADMIN,
      onboardingDone: true,
      isActive: true,
    },
  });

  await prisma.adminProfile.upsert({
    where: { userId: ownerAdmin.id },
    create: { userId: ownerAdmin.id, displayName: "Администратор" },
    update: { displayName: "Администратор" },
  });

  const customer = await prisma.user.upsert({
    where: { email: customerEmail },
    create: {
      email: customerEmail,
      passwordHash,
      role: Role.CUSTOMER,
      onboardingDone: true,
    },
    update: {
      passwordHash,
      onboardingDone: true,
      isActive: true,
    },
  });

  const executor = await prisma.user.upsert({
    where: { email: executorEmail },
    create: {
      email: executorEmail,
      passwordHash,
      role: Role.EXECUTOR,
      onboardingDone: true,
    },
    update: {
      passwordHash,
      onboardingDone: true,
      isActive: true,
    },
  });

  await prisma.customerProfile.upsert({
    where: { userId: customer.id },
    create: {
      userId: customer.id,
      displayName: "Заказчик демо",
      balanceCents: 5_000_000,
    },
    update: {
      displayName: "Заказчик демо",
      balanceCents: 5_000_000,
    },
  });

  await prisma.executorProfile.upsert({
    where: { userId: executor.id },
    create: {
      userId: executor.id,
      displayName: "Исполнитель демо",
      username: "demo_executor",
      accountStatus: ExecutorAccountStatus.ACTIVE,
    },
    update: {
      displayName: "Исполнитель демо",
      username: "demo_executor",
      accountStatus: ExecutorAccountStatus.ACTIVE,
    },
  });

  const demoPubTitle = "Демо: вёрстка лендинга";
  const existingPub = await prisma.order.findFirst({
    where: { customerId: customer.id, title: demoPubTitle },
  });
  if (!existingPub) {
    await prisma.$transaction(async (tx) => {
      const oPub = await tx.order.create({
        data: {
          customerId: customer.id,
          title: demoPubTitle,
          description:
            "Нужна адаптивная вёрстка по макету. Это демо-заказ для витрины исполнителям.",
          categoryId: catDev.id,
          subcategoryId: subWeb.id,
          budgetCents: 1_500_000,
          budgetType: BudgetType.FIXED,
          visibilityType: VisibilityType.OPEN_FOR_RESPONSES,
          status: OrderStatus.PUBLISHED,
          paymentStatus: PaymentStatus.UNPAID,
        },
      });
      const chatPub = await tx.chat.create({ data: { orderId: oPub.id } });
      await tx.chatMember.create({ data: { chatId: chatPub.id, userId: customer.id } });
      await appendStatusHistory(tx, {
        orderId: oPub.id,
        fromStatus: null,
        toStatus: OrderStatus.PUBLISHED,
        actorUserId: admin.id,
        note: "Демо-данные seed",
      });
    });
  }

  const demoProgTitle = "Демо: правки по API";
  const existingProg = await prisma.order.findFirst({
    where: { customerId: customer.id, title: demoProgTitle },
  });
  if (!existingProg) {
    await prisma.$transaction(async (tx) => {
      const oProg = await tx.order.create({
        data: {
          customerId: customer.id,
          executorId: executor.id,
          title: demoProgTitle,
          description: "Мелкие доработки REST API (заказ в работе, демо).",
          categoryId: catDev.id,
          subcategoryId: subApi.id,
          budgetCents: 800_000,
          budgetType: BudgetType.FIXED,
          visibilityType: VisibilityType.PLATFORM_ASSIGN,
          status: OrderStatus.ASSIGNED,
          assignedByAdmin: true,
          paymentStatus: PaymentStatus.RESERVED,
        },
      });

      await tx.customerProfile.update({
        where: { userId: customer.id },
        data: { balanceCents: { decrement: 800_000 } },
      });
      await tx.transaction.create({
        data: {
          type: TransactionType.RESERVE,
          amountCents: 800_000,
          currency: "RUB",
          orderId: oProg.id,
          fromUserId: customer.id,
          meta: { note: "Демо: резерв под заказ (безопасная сделка)" },
        },
      });

      await tx.assignment.create({
        data: {
          orderId: oProg.id,
          executorId: executor.id,
          assignedByAdminUserId: admin.id,
        },
      });

      const chatProg = await tx.chat.create({ data: { orderId: oProg.id } });
      await tx.chatMember.createMany({
        data: [
          { chatId: chatProg.id, userId: customer.id },
          { chatId: chatProg.id, userId: executor.id },
        ],
      });

      await appendStatusHistory(tx, {
        orderId: oProg.id,
        fromStatus: null,
        toStatus: OrderStatus.ASSIGNED,
        actorUserId: admin.id,
        note: "Демо: назначение",
      });

      await tx.order.update({
        where: { id: oProg.id },
        data: { status: OrderStatus.IN_PROGRESS },
      });

      await appendStatusHistory(tx, {
        orderId: oProg.id,
        fromStatus: OrderStatus.ASSIGNED,
        toStatus: OrderStatus.IN_PROGRESS,
        actorUserId: executor.id,
        note: "Демо: старт работ",
      });
    });
  }

  const welcome = await prisma.notification.findFirst({
    where: { userId: customer.id, title: "Добро пожаловать в DONE48" },
  });
  if (!welcome) {
    await prisma.notification.create({
      data: {
        userId: customer.id,
        kind: NotificationKind.GENERIC,
        title: "Добро пожаловать в DONE48",
        body: "Тестовое уведомление после seed. Откройте список уведомлений в меню.",
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed OK.");
  // eslint-disable-next-line no-console
  console.log("  Админ:", adminEmail, "/ demo12345");
  // eslint-disable-next-line no-console
  console.log("  Заказчик:", customerEmail, "/ demo12345");
  // eslint-disable-next-line no-console
  console.log("  Исполнитель:", executorEmail, "/ demo12345");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
