// Run only from a trusted terminal after the Better Auth migration.
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

const email = "farisamrullah4321@gmail.com";
const password = process.env.ADMIN_SETUP_PASSWORD;
if (!process.env.DATABASE_URL || !password || password.length < 8) {
  throw new Error("DATABASE_URL and ADMIN_SETUP_PASSWORD (at least 8 characters) are required");
}
const hash = await hashPassword(password);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", ["ghlib-user-provisioning"]);
  let { rows } = await client.query('SELECT id FROM "user" WHERE lower(email) = $1 FOR UPDATE', [email]);
  const authUserId = rows[0]?.id || randomUUID();
  if (rows.length) {
    await client.query('UPDATE "user" SET "emailVerified" = true, "updatedAt" = NOW() WHERE id = $1', [authUserId]);
  } else {
    await client.query('INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt") VALUES ($1, $2, $3, true, NOW(), NOW())', [authUserId, "Admin", email]);
  }
  ({ rows } = await client.query('SELECT id FROM account WHERE "userId" = $1 AND "providerId" = $2 FOR UPDATE', [authUserId, "credential"]));
  if (rows.length) {
    await client.query('UPDATE account SET password = $1, "updatedAt" = NOW() WHERE id = $2', [hash, rows[0].id]);
    await client.query('DELETE FROM session WHERE "userId" = $1', [authUserId]);
  } else {
    await client.query('INSERT INTO account (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $2, $3, $4, NOW(), NOW())', [randomUUID(), authUserId, "credential", hash]);
  }
  await client.query(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT DEFAULT '',
    picture TEXT DEFAULT '', role TEXT DEFAULT 'client', created_at TEXT NOT NULL
  )`);
  const existing = await client.query('SELECT user_id FROM users WHERE lower(email) = $1 FOR UPDATE', [email]);
  if (existing.rows.length) {
    await client.query("UPDATE users SET role = 'admin' WHERE user_id = $1", [existing.rows[0].user_id]);
  } else {
    await client.query("INSERT INTO users (user_id, email, name, role, created_at) VALUES ($1, $2, $3, 'admin', $4)", [randomUUID(), email, "Admin", new Date().toISOString()]);
  }
  await client.query("COMMIT");
  console.log(`Akun admin ${email} siap digunakan.`);
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
