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

| Роль        | Email                 |
| ----------- | --------------------- |
| Админ       | `admin@demo.local`    |
| Заказчик    | `customer@demo.local` |
| Исполнитель | `executor@demo.local` |

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

Нет реального платёжного шлюза, email/Telegram-рассылки, загрузки файлов в S3 (в чате допускаются только http(s)-ссылки), споров/отзывов/портфолио в полном объёме — часть экранов остаётся заглушками.
