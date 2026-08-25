import { periodExportData, periodWorkbookBuffer } from "@/lib/export";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeFileName(label: string): string {
  const clean = label.replace(/[^\x20-\x7e]|[\\/:*?"<>|]/g, "-").trim();
  return `${clean || "Max export"}.xlsx`;
}

function encodedFileName(label: string): string {
  return encodeURIComponent(`${label}.xlsx`).replace(/['()]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ periodId: string }> }
) {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const { periodId: rawPeriodId } = await params;
  const periodId = Number(rawPeriodId);
  if (!Number.isInteger(periodId) || periodId <= 0) {
    return Response.json({ error: "Period not found" }, { status: 404 });
  }
  const period = await periodExportData(user.id, periodId);
  if (!period) return Response.json({ error: "Period not found" }, { status: 404 });

  const workbook = await periodWorkbookBuffer(period);
  return new Response(new Uint8Array(workbook), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${safeFileName(period.label)}"; filename*=UTF-8''${encodedFileName(period.label)}`,
      "Cache-Control": "private, no-store",
      "X-Max-Export-Limitation": "Recurring groups become one flat bills list",
    },
  });
}
