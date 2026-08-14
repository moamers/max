/**
 * B-23 (banned vocabulary) enforced in code, not in a prompt.
 *
 * T-6: prompts drift and truncate; these particular failures have real human
 * cost. Every piece of user-facing generated text passes through here before
 * it can be emitted (T-13).
 */

/** Words that convert information into a verdict. B-23. */
const BANNED = [
  "wasting",
  "wasted",
  "waste",
  "overspending",
  "overspent",
  "overspend",
  "splurging",
  "splurged",
  "should have",
  "shouldn't have",
  "should've",
  "bad habit",
  "failed",
  "failing",
  "behind",
  "guilty",
  "indulgent",
  "frivolous",
  "undisciplined",
  "reckless",
  "careless",
  "too much",
] as const;

export interface ToneViolation {
  term: string;
  index: number;
}

/** Word-boundary match so "beHIND" inside another word doesn't false-positive. */
function findTerm(haystack: string, term: string): number {
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}])`, "iu");
  return haystack.search(pattern);
}

export function findToneViolations(text: string): ToneViolation[] {
  const out: ToneViolation[] = [];
  for (const term of BANNED) {
    const index = findTerm(text, term);
    if (index >= 0) out.push({ term, index });
  }
  return out;
}

export function isToneCompliant(text: string): boolean {
  return findToneViolations(text).length === 0;
}

/**
 * The emit gate (T-13). Fails loudly rather than emitting with a warning —
 * a doctrine violation that ships is worse than a missing sentence.
 */
export function assertToneCompliant(text: string, context = "generated text"): void {
  const violations = findToneViolations(text);
  if (violations.length > 0) {
    throw new Error(
      `B-23 violation in ${context}: ${violations.map((v) => `"${v.term}"`).join(", ")} — ${JSON.stringify(text)}`
    );
  }
}

/** Filters a batch, dropping non-compliant entries rather than throwing. */
export function keepToneCompliant<T extends { text: string }>(items: T[]): T[] {
  return items.filter((i) => isToneCompliant(i.text));
}
