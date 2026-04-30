import { neon } from "@neondatabase/serverless";

type NeonSql = ReturnType<typeof neon>;

let sql: NeonSql | null = null;

export function getSql() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
