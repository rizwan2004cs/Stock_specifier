import { put } from "@vercel/blob";
import { requireUserId } from "@/lib/auth";
import { getSql } from "@/lib/db/neon";

export const maxDuration = 30;

/**
 * Upload an Excel file + parsed holdings JSON to Vercel Blob.
 * Called from the client after Excel import.
 */
export async function POST(req: Request) {
  const userId = await requireUserId();

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json(
      { error: "Blob storage not configured" },
      { status: 501 }
    );
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const holdingsJson = formData.get("holdings") as string | null;

  if (!file || !holdingsJson) {
    return Response.json(
      { error: "Missing file or holdings data" },
      { status: 400 }
    );
  }

  const timestamp = new Date().toISOString();
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const versionId = `${userId}/${safeTimestamp}`;

  try {
    // Upload original Excel file to Blob
    const excelBlob = await put(
      `portfolios/${versionId}/${file.name}`,
      file,
      { access: "public" }
    );

    // Upload parsed holdings JSON to Blob
    const holdingsBlob = await put(
      `portfolios/${versionId}/holdings.json`,
      holdingsJson,
      { access: "public", contentType: "application/json" }
    );

    // Parse holdings to get metadata
    let holdingsCount = 0;
    let totalInvested = 0;
    try {
      const holdings = JSON.parse(holdingsJson) as Array<{
        quantity: number;
        averagePrice: number;
      }>;
      holdingsCount = holdings.length;
      totalInvested = holdings.reduce(
        (sum, h) => sum + h.quantity * h.averagePrice,
        0
      );
    } catch {
      // Non-critical
    }

    // Save version metadata to Neon DB
    const sql = getSql();
    if (sql) {
      try {
        await sql`
          create table if not exists portfolio_versions (
            id text primary key,
            user_id text not null,
            uploaded_at timestamptz not null default now(),
            holdings_count integer not null default 0,
            total_invested numeric not null default 0,
            excel_url text,
            holdings_url text
          )
        `;
        await sql`
          insert into portfolio_versions (id, user_id, uploaded_at, holdings_count, total_invested, excel_url, holdings_url)
          values (${versionId}, ${userId}, ${timestamp}, ${holdingsCount}, ${totalInvested}, ${excelBlob.url}, ${holdingsBlob.url})
        `;
      } catch {
        // Non-critical — files are already in Blob
      }
    }

    return Response.json({
      success: true,
      version: {
        id: versionId,
        uploadedAt: timestamp,
        holdingsCount,
        totalInvested,
        excelUrl: excelBlob.url,
        holdingsUrl: holdingsBlob.url
      }
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to upload to Blob", details: String(error) },
      { status: 500 }
    );
  }
}
