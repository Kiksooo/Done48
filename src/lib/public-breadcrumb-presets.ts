import type { BreadcrumbItem } from "@/components/public/public-breadcrumbs";

const HOME: BreadcrumbItem = { label: "Главная", href: "/" };

export const BREADCRUMB_LOGIN: BreadcrumbItem[] = [
  HOME,
  { label: "Вход в кабинет", href: "/login" },
];

export const BREADCRUMB_REGISTER: BreadcrumbItem[] = [
  HOME,
  { label: "Регистрация", href: "/register" },
];

export const BREADCRUMB_FORGOT_PASSWORD: BreadcrumbItem[] = [
  HOME,
  { label: "Восстановление пароля", href: "/forgot-password" },
];

export const BREADCRUMB_EXECUTORS: BreadcrumbItem[] = [
  HOME,
  { label: "Каталог специалистов", href: "/executors" },
];

export const BREADCRUMB_BLOG_INDEX: BreadcrumbItem[] = [
  HOME,
  { label: "Блог", href: "/blog" },
];

export const BREADCRUMB_VACANCIES: BreadcrumbItem[] = [
  HOME,
  { label: "Вакансии", href: "/vacancies" },
];

export function breadcrumbJobVacancy(slug: string, title: string): BreadcrumbItem[] {
  return [...BREADCRUMB_VACANCIES, { label: title, href: `/vacancies/${slug}` }];
}

export function breadcrumbBlogPost(slug: string, title: string): BreadcrumbItem[] {
  return [...BREADCRUMB_BLOG_INDEX, { label: title, href: `/blog/${slug}` }];
}

export const BREADCRUMB_LEGAL_INDEX: BreadcrumbItem[] = [
  HOME,
  { label: "Юридическая информация", href: "/legal" },
];

export const BREADCRUMB_LEGAL_TERMS: BreadcrumbItem[] = [
  ...BREADCRUMB_LEGAL_INDEX,
  { label: "Пользовательское соглашение", href: "/legal/terms" },
];

export const BREADCRUMB_LEGAL_PRIVACY: BreadcrumbItem[] = [
  ...BREADCRUMB_LEGAL_INDEX,
  { label: "Политика конфиденциальности", href: "/legal/privacy" },
];

export const BREADCRUMB_LEGAL_FEES: BreadcrumbItem[] = [
  ...BREADCRUMB_LEGAL_INDEX,
  { label: "Комиссии и расчёты", href: "/legal/fees" },
];
