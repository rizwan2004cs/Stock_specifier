import { put, list } from "@vercel/blob";
import type { HoldingInput } from "@/lib/types";
import { getSql } from "@/lib/db/neon";

export type PortfolioVersion = {
  id: string;
  uploadedAt: string;
  holdingsCount: number;
  totalInvested: number;
  blobUrl: string;
};

/**
 * Save a versioned snapshot of the portfolio to Blob storage.
 * Also records metadata in Neon for listing versions.
 */
export async function savePortfolioVersion(
  userId: string,
  holdings: HoldingInput[],
  originalFile?: File
) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return null;
  }

  const timestamp = new Date().toISOString();
  const versionId = `${userId}/${timestamp.replace(/[:.]/g, "-")}`;

  // Save holdings JSON to Blob
  const holdingsBlob = await put(
    `portfolios/${versionId}/holdings.json`,
    JSON.stringify(holdings, null, 2),
    { access: "public", contentType: "application/json" }
  );

  // Save original Excel file if provided
  if (originalFile) {
    await put(
      `portfolios/${versionId}/${originalFile.name}`,
      originalFile,
      { access: "public" }
    ).catch(() => null);
  }

  // Record version metadata in Neon
  const sql = getSql();
  if (sql) {
    try {
      await sql`
        create table if not exists portfolio_versions (
          id text primary key,
          user_id text not null,
          uploaded_at timestamptz not null default now(),
          holdings_count integer not null,
          total_invested numeric not null,
          blob_url text not null
        )
      `;
      const totalInvested = holdings.reduce(
        (sum, h) => sum + h.quantity * h.averagePrice,
        0
      );
      await sql`
        insert into portfolio_versions (id, user_id, uploaded_at, holdings_count, total_invested, blob_url)
        values (${versionId}, ${userId}, ${timestamp}, ${holdings.length}, ${totalInvested}, ${holdingsBlob.url})
      `;
    } catch {
      // Non-critical — version still saved to Blob
    }
  }

  return {
    id: versionId,
    uploadedAt: timestamp,
    holdingsCount: holdings.length,
    totalInvested: holdings.reduce((sum, h) => sum + h.quantity * h.averagePrice, 0),
    blobUrl: holdingsBlob.url
  } satisfies PortfolioVersion;
}

/**
 * List all portfolio versions for a user.
 */
export async function listPortfolioVersions(userId: string): Promise<PortfolioVersion[]> {
  const sql = getSql();
  if (!sql) {
    return [];
  }

  try {
    const rows = (await sql`
      select id, uploaded_at, holdings_count, total_invested, blob_url
      from portfolio_versions
      where user_id = ${userId}
      order by uploaded_at desc
      limit 20
    `) as unknown as Array<{
      id: string;
      uploaded_at: string;
      holdings_count: number;
      total_invested: number;
      blob_url: string;
    }>;

    return rows.map((row) => ({
      id: row.id,
      uploadedAt: row.uploaded_at,
      holdingsCount: row.holdings_count,
      totalInvested: row.total_invested,
      blobUrl: row.blob_url
    }));
  } catch {
    return [];
  }
}
