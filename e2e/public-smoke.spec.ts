import { expect, test } from "@playwright/test";

/**
 * Публичные страницы без логина + health.
 * Локально: npm run test:e2e -- e2e/public-smoke.spec.ts
 * Против прода: PLAYWRIGHT_BASE_URL=https://ваш-домен npm run test:e2e -- e2e/public-smoke.spec.ts
 */
test.describe("Public smoke", () => {
  test("главная открывается", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });

  test("юридические страницы без редиректа на логин", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.getByRole("heading", { name: /пользовательское соглашение/i })).toBeVisible();
    await page.goto("/legal/privacy");
    await expect(page.getByRole("heading", { name: /политика конфиденциальности/i })).toBeVisible();
  });

  test("GET /api/health возвращает ok и db", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as { ok?: boolean; db?: boolean };
    expect(json.ok).toBe(true);
    expect(json.db).toBe(true);
  });
});
