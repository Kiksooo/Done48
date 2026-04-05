/**
 * Тест SMTP-подключения и отправки письма.
 * Запуск: npx tsx scripts/test-smtp.ts recipient@example.com
 *
 * Читает из .env: SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM.
 */
import "dotenv/config";
import nodemailer from "nodemailer";

const to = process.argv[2];
if (!to) {
  console.error("Использование: npx tsx scripts/test-smtp.ts <email-получателя>");
  process.exit(1);
}

const host = process.env.SMTP_HOST?.trim();
const portRaw = process.env.SMTP_PORT?.trim();
const port = portRaw ? parseInt(portRaw, 10) : 587;
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASSWORD?.trim();
const secureEnv = process.env.SMTP_SECURE?.trim()?.toLowerCase();
const secure = secureEnv === "true" || secureEnv === "1" || port === 465;
const from = process.env.EMAIL_FROM?.trim() || user || "test@test.com";

console.log("=== SMTP config ===");
console.log("  SMTP_HOST:", host || "(не задан!)");
console.log("  SMTP_PORT:", port);
console.log("  SMTP_SECURE:", secure);
console.log("  SMTP_USER:", user || "(не задан)");
console.log("  SMTP_PASSWORD:", pass ? `***${pass.slice(-3)}` : "(не задан!)");
console.log("  EMAIL_FROM:", from);
console.log("  Получатель:", to);
console.log();

if (!host) {
  console.error("❌ SMTP_HOST не задан в .env — нечего проверять.");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: user ? { user, pass: pass ?? "" } : undefined,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 15_000,
  logger: true,
  debug: true,
});

async function main() {
  console.log("--- Проверка подключения (verify) ---");
  try {
    await transporter.verify();
    console.log("✅ SMTP-подключение успешно!\n");
  } catch (e) {
    console.error("❌ Ошибка подключения к SMTP:", (e as Error).message);
    console.error("   Полная ошибка:", e);
    process.exit(1);
  }

  console.log("--- Отправка тестового письма ---");
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "DONE48 — тестовое письмо SMTP",
      text: "Если вы видите это письмо — SMTP-настройки работают корректно.",
      html: "<p>Если вы видите это письмо — <b>SMTP-настройки работают корректно</b>.</p>",
    });
    console.log("✅ Письмо отправлено!");
    console.log("   Message-ID:", info.messageId);
    console.log("   Response:", info.response);
  } catch (e) {
    console.error("❌ Ошибка отправки:", (e as Error).message);
    console.error("   Полная ошибка:", e);
    process.exit(1);
  }
}

main();
