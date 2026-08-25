import { YearView } from "@/components/year/YearView";
import { listPeriodsMeta } from "@/lib/queries/period-meta";
import { pickRecordedYear, yearOverview, yearsWithRecordedData } from "@/lib/queries/year";
import { requireUser } from "@/lib/session";

type SearchParams = { year?: string | string[] };

export default async function YearPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const user = await requireUser();
  const [params, periodMeta] = await Promise.all([searchParams, listPeriodsMeta(user.id)]);
  const availableYears = yearsWithRecordedData(periodMeta);
  const requested = Array.isArray(params.year) ? params.year[0] : params.year;
  const year = pickRecordedYear(requested, availableYears, new Date().getUTCFullYear());
  const data = await yearOverview(user.id, periodMeta, year);

  return <YearView data={data} availableYears={availableYears} />;
}
