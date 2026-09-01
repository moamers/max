import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RolloverPrompt } from "@/components/home/RolloverPrompt";
import { listPeriodsMeta } from "@/lib/queries";
import {
  dominantMonth,
  isoDate,
  periodHasEnded,
  proposePeriodForMonth,
} from "@/lib/periods";
import { periodHome } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { userHasRecurring } from "@/lib/store";

export const dynamic = "force-dynamic";

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

type SearchParams = { [key: string]: string | string[] | undefined };

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** `?month=2026-09`. A month key, not a date — a period is not a calendar month. */
export function parseMonthKey(raw: string | undefined): { year: number; monthIndex: number } | null {
  if (!raw) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(raw.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;
  return { year, monthIndex: month - 1 };
}

/**
 * A month that does not exist yet, opened.
 *
 * > "for non created months a user should be allowed to click and see empty
 * > month state screen which shows the create month message/button with check
 * > to copy recurring"
 *
 * **This page creates nothing.** Every read below is a read; the only write in
 * the flow is behind the button, in `acceptRollover`. That is the same line
 * #46 held, and it supersedes the open question in `docs/product/12-build-tasks.md`
 * Task C about how many months to pre-create: none are pre-created, ever. A
 * month exists when someone presses a button, and until then it is an offer.
 */
export default async function StartMonthPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const month = parseMonthKey(single((await searchParams).month));
  if (!month) notFound();

  const today = new Date();
  const periods = await listPeriodsMeta(user.id, today);

  // A stale link to a month that does exist belongs on that month, not here.
  const already = periods.find((period) => {
    if (!period.window) return false;
    const named = dominantMonth(period.window.start, period.window.end);
    return named.getUTCFullYear() === month.year && named.getUTCMonth() === month.monthIndex;
  });
  if (already) redirect(periodHome(already.id));

  const latestEnd = periods.reduce<Date | null>((latest, period) => {
    if (!period.window) return latest;
    return latest === null || period.window.end > latest ? period.window.end : latest;
  }, null);
  const proposal = proposePeriodForMonth(month, latestEnd ? isoDate(latestEnd) : null, today);
  // A month that has already finished is never offered: back-filling it would
  // render a stretch of £0 spending as though it were real.
  const offer = proposal && !periodHasEnded(proposal.endDate, today) ? proposal : null;
  const canCopyRecurring = offer ? await userHasRecurring(user.id) : false;

  const monthName = MONTH.format(new Date(Date.UTC(month.year, month.monthIndex, 1)));
  const startMs = offer ? new Date(`${offer.startDate}T00:00:00Z`).getTime() : 0;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "28px 20px 40px", display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <span
          style={{
            fontVariantNumeric: "tabular-nums",
            fontSize: "var(--type-caption)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          {month.year}
        </span>
        <h1 style={{ margin: 0, fontSize: "var(--type-display)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.05 }}>
          {monthName}
        </h1>
        <p style={{ margin: 0, fontSize: "var(--type-body)", color: "var(--text-secondary)", textWrap: "pretty" }}>
          {offer
            ? "This month hasn't been started yet. Here is what it would cover."
            : "This month hasn't been started, and it has already finished — so there is nothing here to open."}
        </p>
      </div>

      {offer && (
        <RolloverPrompt
          proposal={{
            startDate: offer.startDate,
            fourWeekEnd: isoDate(new Date(startMs + 27 * 86_400_000)),
            fiveWeekEnd: isoDate(new Date(startMs + 34 * 86_400_000)),
            proposedWeeks: offer.weekCount,
            canCopyRecurring,
          }}
          eyebrow={`Start ${monthName}`}
          cta={`Start ${monthName}`}
        />
      )}

      <Link href="/" style={{ fontSize: "var(--type-label)", color: "var(--text-secondary)" }}>
        Back to your month
      </Link>
    </div>
  );
}
