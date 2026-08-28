import type { SuggestionEntry, SuggestionHistory } from "@/lib/queries/suggestions";

export type SuggestionKind = "merchant" | "label";

export const MAX_VISIBLE_SUGGESTIONS = 5;

function recentTime(entry: SuggestionEntry): number {
  const parsed = Date.parse(entry.mostRecent);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Match without changing the user's value. A literal `includes` deliberately
 * avoids turning punctuation such as `[` or `+` into regular-expression code.
 */
export function filterAndRankSuggestions(
  entries: readonly SuggestionEntry[],
  query: string,
  limit: number = MAX_VISIBLE_SUGGESTIONS
): SuggestionEntry[] {
  if (entries.length === 0 || limit <= 0) return [];

  const needle = query.toLocaleLowerCase("en-GB");
  return entries
    .filter((entry) => entry.value.toLocaleLowerCase("en-GB").includes(needle))
    .sort((a, b) => {
      return (
        b.count - a.count ||
        recentTime(b) - recentTime(a) ||
        a.value.localeCompare(b.value, "en-GB", { sensitivity: "variant" })
      );
    })
    .slice(0, limit);
}

export function suggestionsOfKind(
  history: SuggestionHistory,
  kind: SuggestionKind
): SuggestionEntry[] {
  return kind === "merchant" ? history.merchants : history.labels;
}

/**
 * TextField and LabelField mount in the same form render. Share only their
 * in-flight request, not resolved data, so a later account in the same browser
 * can never inherit another user's suggestion cache.
 */
let inFlightHistory: Promise<SuggestionHistory> | null = null;

export function coalesceSuggestionLoad(
  load: () => Promise<SuggestionHistory>
): Promise<SuggestionHistory> {
  if (inFlightHistory) return inFlightHistory;

  const request = load();
  inFlightHistory = request;
  void request.then(
    () => {
      if (inFlightHistory === request) inFlightHistory = null;
    },
    () => {
      if (inFlightHistory === request) inFlightHistory = null;
    }
  );
  return request;
}
