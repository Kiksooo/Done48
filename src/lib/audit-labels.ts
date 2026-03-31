/** Человекочитаемые подписи для журнала аудита (коды в БД остаются на английском). */

const AUDIT_ACTION_LABELS: Record<string, string> = {
  ORDER_PUBLISH: "Публикация заказа",
  ORDER_ASSIGN_EXECUTOR: "Назначение исполнителя администратором",
  ORDER_SET_STATUS: "Смена статуса заказа",
  ORDER_ACCEPT_PROPOSAL: "Принят отклик (админ)",
  ORDER_CUSTOMER_ACCEPT_PROPOSAL: "Исполнитель выбран заказчиком",
  ORDER_CUSTOMER_COMPLETE: "Заказ закрыт заказчиком",
  ORDER_EXECUTOR_COMPLETE: "Заказ закрыт исполнителем",
  PLATFORM_SETTINGS_UPDATE: "Обновление настроек платформы",
  USER_DELETE: "Удаление пользователя",
  EXECUTOR_ACCOUNT_STATUS_SET: "Статус анкеты исполнителя",
  FEEDBACK_SUBMIT: "Обратная связь с сайта",
  USER_REPORT_UPDATE: "Обновление жалобы",
  BLOCKLIST_ADD: "Добавление в блоклист контактов",
  BLOCKLIST_REMOVE: "Удаление из блоклиста",
  USER_ACTIVE_SET: "Блокировка / разблокировка пользователя",
  PROFILE_UPDATE: "Обновление профиля",
  DISPUTE_OPEN: "Открыт спор",
  DISPUTE_UPDATE: "Обновление спора",
  CATEGORY_CREATE: "Создание категории",
  CATEGORY_UPDATE: "Изменение категории",
  CATEGORY_DELETE: "Удаление категории",
  SUBCATEGORY_CREATE: "Создание подкатегории",
  SUBCATEGORY_UPDATE: "Изменение подкатегории",
  SUBCATEGORY_DELETE: "Удаление подкатегории",
  PORTFOLIO_CREATE: "Добавление работы в портфолио",
  PORTFOLIO_UPDATE: "Изменение портфолио",
  PORTFOLIO_DELETE: "Удаление из портфолио",
};

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Order: "Заказ",
  Feedback: "Обращение",
  ExecutorProfile: "Профиль исполнителя",
  User: "Пользователь",
  PlatformSettings: "Настройки платформы",
  UserReport: "Жалоба",
  ContactBlocklist: "Блоклист контактов",
  CustomerProfile: "Профиль заказчика",
  Dispute: "Спор",
  Category: "Категория",
  Subcategory: "Подкатегория",
  PortfolioItem: "Портфолио",
};

export function auditActionRu(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

export function auditEntityTypeRu(entityType: string): string {
  return AUDIT_ENTITY_LABELS[entityType] ?? entityType;
}
