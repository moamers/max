import { YearView } from "@/components/year/YearView";
import { findPeriod, periodParamValue, pickCurrentPeriodId, type PeriodSearchParams } from "@/lib/queries";
import { listPeriodsMeta } from "@/lib/queries/period-meta";
import { pickRecordedYear, yearOverview, yearsWithRecordedData } from "@/lib/queries/year";
import { currentWeekOf } from "@/lib/routes";
import { requireUser } from "@/lib/session";

type SearchParams = PeriodSearchParams & { year?: string | string[] };

/**
 * `?period=` is read here but changes nothing that is shown: the year is the
 * whole account's, not one period's. It is the return address the bottom nav
 * needs — see `yearHome` — and it costs no extra query, because the period
 * list this page already loads for the year is the same list it is resolved
 * against. An unrecognised id falls back to the current period rather than
 * failing, matching `resolvePeriodId` everywhere else (#46).
 */
export default async function YearPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const [params, periodMeta] = await Promise.all([searchParams, listPeriodsMeta(user.id)]);
  const availableYears = yearsWithRecordedData(periodMeta);
  const requested = Array.isArray(params.year) ? params.year[0] : params.year;
  const year = pickRecordedYear(requested, availableYears, new Date().getUTCFullYear());
  const data = await yearOverview(user.id, periodMeta, year);

  const requestedPeriod = Number(periodParamValue(params));
  const selected =
    findPeriod(periodMeta, Number.isInteger(requestedPeriod) ? requestedPeriod : null) ??
    findPeriod(periodMeta, pickCurrentPeriodId(periodMeta));

  return (
    <YearView
      data={data}
      availableYears={availableYears}
      periodId={selected?.id ?? null}
      weekNumber={currentWeekOf(selected?.window ?? null)}
    />
  );
}
