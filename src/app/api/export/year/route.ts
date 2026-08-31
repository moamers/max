import { buildYearRoundupCsv, yearExportData } from "@/lib/export";
import { getSessionUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const csv = buildYearRoundupCsv(await yearExportData(user.id));
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="Ravel year round-up.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
