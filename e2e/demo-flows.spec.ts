import { expect, test } from "@playwright/test";

const customer = { email: "customer@demo.local", password: "demo12345" };
const admin = { email: "admin@demo.local", password: "demo12345" };
const executor = { email: "executor@demo.local", password: "demo12345" };

test.describe.serial("Демо-аккаунты (нужен npm run db:seed)", () => {
  test("заказчик входит и резервирует демо-заказ «вёрстка лендинга»", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(customer.email);
    await page.getByLabel("Пароль").fill(customer.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/customer/);

    await page.goto("/customer/orders");
    await page.getByRole("link", { name: "Демо: вёрстка лендинга" }).click();
    await expect(page).toHaveURL(/\/orders\//);

    const reserveBtn = page.getByRole("button", { name: /Зарезервировать/ });
    if (await reserveBtn.isVisible()) {
      await reserveBtn.click();
    }
    await expect(page.getByText("Зарезервировано")).toBeVisible();
  });

  test("админ входит в кабинет", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Пароль").fill(admin.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/admin/);
    await expect(page.getByRole("heading", { name: "Дашборд" })).toBeVisible();
  });

  test("исполнитель откликается на демо-заказ «вёрстка лендинга»", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(executor.email);
    await page.getByLabel("Пароль").fill(executor.password);
    await page.getByRole("button", { name: "Войти" }).click();
    await expect(page).toHaveURL(/\/executor/);

    await page.goto("/executor/orders/available");
    await page.getByRole("link", { name: "Демо: вёрстка лендинга" }).click();
    await expect(page).toHaveURL(/\/orders\//);

    const submit = page.getByRole("button", { name: "Отправить отклик" });
    if (await submit.isVisible()) {
      await page.locator("#offMsg").fill("E2E: готов взяться за вёрстку по макету.");
      await submit.click();
      await expect(submit).not.toBeVisible({ timeout: 25_000 });
    } else {
      await expect(page.getByRole("heading", { name: "Действия исполнителя" })).toBeVisible();
    }
  });
});
