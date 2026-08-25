/**
 * This is a share of a known total, not the budget chart grammar. Its width is
 * allowed to be proportional because it answers "which recurring group makes
 * up this total?", never "how is spend tracking against a target?".
 */
export function recurringSharePercent(groupTotal: number, recurringTotal: number): number {
  if (!Number.isFinite(groupTotal) || !Number.isFinite(recurringTotal) || recurringTotal <= 0) {
    return 0;
  }
  return Math.min(100, Math.max(0, (groupTotal / recurringTotal) * 100));
}

/**
 * The imported note is kept verbatim in the UI. This derives only the compact
 * instalment status the handoff calls for; code does the count (T-2).
 */
export function instalmentsStillDue(note: string | null): string | null {
  if (!note) return null;

  const match = /\binstall?ments?\s+(\d+)\s+of\s+(\d+)\b/i.exec(note);
  if (!match) return null;

  const current = Number(match[1]);
  const total = Number(match[2]);
  if (!Number.isInteger(current) || !Number.isInteger(total) || current < 0 || total < 1 || current >= total) {
    return null;
  }

  return `${total - current} of ${total} still due`;
}
