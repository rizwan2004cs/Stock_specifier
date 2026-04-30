import type { HoldingInput } from "@/lib/types";
import { getSql } from "@/lib/db/neon";

export async function ensurePortfolioTables() {
  const sql = getSql();
  if (!sql) {
    return false;
  }

  await sql`
    create table if not exists portfolios (
      user_id text primary key,
      holdings jsonb not null default '[]'::jsonb,
      advisor_memory text not null default '',
      updated_at timestamptz not null default now()
    )
  `;
  return true;
}

export async function loadPortfolio(userId: string) {
  const sql = getSql();
  if (!sql) {
    return { holdings: [] as HoldingInput[], advisorMemory: "" };
  }

  await ensurePortfolioTables();
  const rows = (await sql`
    select holdings, advisor_memory
    from portfolios
    where user_id = ${userId}
    limit 1
  `) as unknown as Array<{
    holdings: HoldingInput[];
    advisor_memory: string;
  }>;
  const row = rows[0] as
    | { holdings: HoldingInput[]; advisor_memory: string }
    | undefined;

  return {
    holdings: row?.holdings ?? [],
    advisorMemory: row?.advisor_memory ?? ""
  };
}

export async function savePortfolio(userId: string, holdings: HoldingInput[]) {
  const sql = getSql();
  if (!sql) {
    return false;
  }

  await ensurePortfolioTables();
  await sql`
    insert into portfolios (user_id, holdings, updated_at)
    values (${userId}, ${JSON.stringify(holdings)}::jsonb, now())
    on conflict (user_id)
    do update set holdings = excluded.holdings, updated_at = now()
  `;
  return true;
}

export async function saveAdvisorMemory(userId: string, memory: string) {
  const sql = getSql();
  if (!sql) {
    return false;
  }

  await ensurePortfolioTables();
  await sql`
    insert into portfolios (user_id, advisor_memory, updated_at)
    values (${userId}, ${memory}, now())
    on conflict (user_id)
    do update set advisor_memory = excluded.advisor_memory, updated_at = now()
  `;
  return true;
}
