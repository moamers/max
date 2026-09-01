import { cookies } from "next/headers";
import { MODE_COOKIE, THEME_COOKIE, parseMode, parseTheme } from "@/lib/brand";
import { findPeriod, listPeriodsMeta, periodParamValue, pickCurrentPeriodId, type PeriodSearchParams } from "@/lib/queries";
import { currentWeekOf } from "@/lib/routes";
import { requireUser } from "@/lib/session";
import { SettingsScreen } from "@/components/menu/Menu";

export const dynamic = "force-dynamic";

/**
 * Screen 10, which used to be a drawer over home (Task F).
 *
 * `Menu` was handed `periodCount` and `brand` by a screen that had already
 * loaded them. A standalone route has to fetch them itself, and this is the
 * only place that happens: the pill renders from plain props, so navigating
 * between screens does not re-run this, and rendering the pill on any screen
 * costs nothing.
 *
 * One query. `listPeriodsMeta` answers all three questions this page has —
 * how many periods Clear data would remove, which period the visitor came
 * from, and where today falls inside it — so `resolvePeriodId` is deliberately
 * not used here; it would list the same rows a second time.
 *
 * On `?period=`: this screen shows nothing that belongs to a period. It takes
 * one anyway because the nav it carries offers Week and Month, and a Settings
 * trip that dropped the month would land the user in a different one on the
 * way out. An unrecognised id falls back to the current period rather than
 * failing — the same rule `resolvePeriodId` applies everywhere else (#46).
 */
export default async function SettingsPage({ searchParams }: { searchParams: Promise<PeriodSearchParams> }) {
  const user = await requireUser();
  const [sp, jar, periodsMeta] = await Promise.all([searchParams, cookies(), listPeriodsMeta(user.id)]);

  const requested = Number(periodParamValue(sp));
  const selected =
    findPeriod(periodsMeta, Number.isInteger(requested) ? requested : null) ??
    findPeriod(periodsMeta, pickCurrentPeriodId(periodsMeta));

  return (
    <SettingsScreen
      periodCount={periodsMeta.length}
      brand={{
        theme: parseTheme(jar.get(THEME_COOKIE)?.value),
        mode: parseMode(jar.get(MODE_COOKIE)?.value),
      }}
      periodId={selected?.id ?? null}
      weekNumber={currentWeekOf(selected?.window ?? null)}
    />
  );
}
