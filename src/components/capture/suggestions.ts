import type { SuggestionEntry, SuggestionHistory } from "@/lib/queries/suggestions";

export type SuggestionKind = "merchant" | "label";

/**
 * Four, and the list is sized to show exactly four — so it never scrolls.
 * A scrolling dropdown over a form on a phone is worse than a shorter list:
 * the fifth-best guess is not worth a scroll gesture inside an overlay.
 */
export const MAX_VISIBLE_SUGGESTIONS = 4;

/** Row height and list padding, shared with TextField so the two agree. */
export const SUGGESTION_ROW_HEIGHT = 44;
export const SUGGESTION_LIST_PADDING = 6;

/**
 * How much has to be typed before anything is offered.
 *
 * At zero, focusing the field matched every entry in the history and dropped a
 * full-height list over the form before the user had said anything — the field
 * answered a question nobody asked. Two characters is enough to mean something
 * and short enough to still save the typing.
 */
export const MIN_QUERY_LENGTH = 2;

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

  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return [];

  const needle = trimmed.toLocaleLowerCase("en-GB");
  const matches = entries.filter((entry) =>
    entry.value.toLocaleLowerCase("en-GB").includes(needle)
  );

  // Offering one suggestion identical to what is already typed is noise — it
  // happens right after picking one, and again once a known name is finished.
  if (matches.length === 1 && matches[0].value.toLocaleLowerCase("en-GB") === needle) {
    return [];
  }

  return matches
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
