import { getSessionUser } from "@/lib/session";
import { listPeriodsMeta } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LOSSY_NOTE = "Spreadsheet round trips lose the recurring group because the sheet has one flat bills list and Ravel has four.";
/**
 * Two states, one colour, on the founder's own request. Said plainly here
 * because an export that implies more fidelity than it has is the same class of
 * problem as a figure you can't trace (B-8).
 */
const HIGHLIGHT_NOTE = "Rows in orange are the ones marked pending or needing a look. One colour covers both, so importing this file again reads them as ordinary rows.";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]!);
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const periods = await listPeriodsMeta(user.id);
  const links = periods.map((period) =>
    `<li><a href="/api/export/workbook/${period.id}">${escapeHtml(period.label)}</a></li>`
  ).join("");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Export from Ravel</title><style>body{font:16px system-ui,sans-serif;max-width:38rem;margin:3rem auto;padding:0 1.25rem;line-height:1.5;background:#121426;color:#fbfaff}a{color:#8f7cff}aside{color:#c8c7cf;border-left:3px solid #45e0b7;padding-left:1rem}li{margin:.75rem 0}</style></head><body><h1>Export from Ravel</h1><aside>${escapeHtml(LOSSY_NOTE)}</aside><aside>${escapeHtml(HIGHLIGHT_NOTE)}</aside><h2>Monthly workbooks</h2>${links ? `<ul>${links}</ul>` : "<p>There are no periods to export yet.</p>"}<h2>Year round-up</h2><p><a href="/api/export/year">Download every period as CSV</a></p></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
