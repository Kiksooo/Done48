/**
 * Общее для test-db-*: разбор .env.test и проверка TCP к Postgres.
 */
const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");

/**
 * @param {string} root
 * @returns {boolean} true если файл есть и подставили переменные
 */
function loadEnvTest(root) {
  const envFile = path.join(root, ".env.test");
  if (!fs.existsSync(envFile)) return false;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  }
  return true;
}

function maskDatabaseUrl(url) {
  try {
    const u = new URL(url);
    if (u.password) u.password = "****";
    return u.toString();
  } catch {
    return "(некорректный URL)";
  }
}

/**
 * @param {string} urlRaw
 * @param {number} timeoutMs
 * @returns {Promise<boolean>}
 */
function postgresTcpReachable(urlRaw, timeoutMs = 3000) {
  try {
    const u = new URL(urlRaw);
    const host = u.hostname;
    const port = u.port ? Number(u.port) : 5432;
    if (!host || Number.isNaN(port)) return Promise.resolve(false);
    return new Promise((resolve) => {
      const socket = net.connect({ host, port }, () => {
        socket.end();
        resolve(true);
      });
      socket.setTimeout(timeoutMs);
      socket.on("timeout", () => {
        socket.destroy();
        resolve(false);
      });
      socket.on("error", () => resolve(false));
    });
  } catch {
    return Promise.resolve(false);
  }
}

module.exports = { loadEnvTest, maskDatabaseUrl, postgresTcpReachable };
