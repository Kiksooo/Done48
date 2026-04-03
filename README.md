# DONE48

Внутренний MVP маркетплейса микро-услуг: три кабинета (администратор, исполнитель, заказчик), заказы, отклики, чат по заказу, демо-финансы (баланс, резерв, холд, выплаты), in-app уведомления.

Стек: **Next.js 14** (App Router), **PostgreSQL** + **Prisma**, **NextAuth** (Credentials, JWT), **Tailwind**, **Zod**, **React Hook Form**.

## Требования

- Node.js 20+
- PostgreSQL

## Настройка

1. Скопируйте переменные окружения:

   ```bash
   cp .env.example .env
   ```

2. Укажите в `.env` как минимум:

   - `DATABASE_URL` — строка подключения к PostgreSQL
   - `NEXTAUTH_SECRET` — случайная строка для подписи сессий
   - `NEXTAUTH_URL` — базовый URL приложения (локально `http://localhost:3000`)

3. Установите зависимости и схему БД:

   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

4. Заполните демо-данные:

   ```bash
   npm run db:seed
   ```

5. Запуск в режиме разработки:

   ```bash
   npm run dev
   ```

## Демо-аккаунты (после `db:seed`)

Пароль для всех: `demo12345`

| Роль        | Email                    |
| ----------- | ------------------------ |
| Админ       | `admin@demo.local`       |
| Админ       | `lidiiakik@gmail.com`    |
| Заказчик    | `customer@demo.local`    |
| Исполнитель | `executor@demo.local`    |

Для `lidiiakik@gmail.com` при **первом** запуске сида задаётся тот же пароль `demo12345`. Если аккаунт с этим email уже был в базе, сид только выставит роль **ADMIN** и не меняет пароль.

В базе появляются категории, два демо-заказа (опубликованный с открытыми откликами и заказ в работе у демо-исполнителя), приветственное уведомление заказчику.

## Скрипты

| Команда            | Назначение              |
| ------------------ | ----------------------- |
| `npm run dev`      | Разработка              |
| `npm run build`    | Сборка (Prisma + Next)  |
| `npm run start`    | Продакшен-сервер        |
| `npm run lint`     | ESLint                  |
| `npm run db:seed`  | Seed                    |
| `npm run db:push`  | Синхронизация схемы     |
| `npm run db:studio`| Prisma Studio           |

## Структура (кратко)

- `src/app` — маршруты: `(auth)`, кабинеты `admin` / `customer` / `executor`, общая карточка заказа `orders/[id]`, API NextAuth
- `src/server/actions` — server actions (заказы, чат, финансы, уведомления)
- `src/server/queries` — чтение из БД
- `src/components` — UI и оболочки кабинетов
- `prisma/schema.prisma` — модель данных

## Ограничения MVP

Пополнение баланса заказчика может идти через **Oplatum** (checkout + вебхук); вывод заказчика в интерфейсе по-прежнему **демо** (без API выплат в публичном OpenAPI Oplatum). Загрузки в S3 — опционально. Юридические страницы: `/legal`, `/legal/terms`, `/legal/fees`, `/legal/privacy`; при регистрации — явное согласие с документами и опциональный opt-in рассылки (`marketingOptIn`).

## Чеклист продакшена (операции и качество)

- **Бэкапы БД** — по расписанию у провайдера (Neon и т.д.) + периодический тест восстановления.
- **Миграции** — `npx prisma migrate deploy` в пайплайне; не полагаться только на `db push`.
- **Секреты** — `NEXTAUTH_SECRET`, ключи Oplatum, `RESEND_API_KEY`, `DATABASE_URL` только в секретах хостинга.
- **Аналитика** — при необходимости `NEXT_PUBLIC_GA_MEASUREMENT_ID` и/или `NEXT_PUBLIC_YANDEX_METRIKA_ID` (или `0`, чтобы отключить Метрику).
- **Ошибки** — подключить Sentry (или аналог) и алерты по 5xx на `/api/webhooks/*`.
- **E2E** — `npm run test:e2e:smoke` после деплоя; в CI см. workflow в `.github/workflows`.
- **Письма** — `RESEND_API_KEY` и подтверждённый домен в Resend для сброса пароля и будущих уведомлений.
