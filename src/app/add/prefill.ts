type SearchParams = { [key: string]: string | string[] | undefined };

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
/** Query params are an integration seam, not trusted form state. */
export function resolveInitialAmount(searchParams: SearchParams): number {
  const raw = single(searchParams.amount);
  if (!raw || !/^\d+(?:\.\d{1,2})?$/.test(raw)) return 0;
  const amount = Number(raw);
  return Number.isFinite(amount) && amount > 0 && amount <= 99_999 ? amount : 0;
}

/**
 * Where the cursor starts on the add sheet.
 *
 * The amount is the first field and the reason the screen is open, so it gets
 * the cursor — but only when the form arrived empty. `/add?amount=&where=&label=`
 * is how another screen hands over a part-filled draft; moving the cursor back
 * to the top of a form someone is already partway through is an interruption.
 */
export function shouldFocusAmount(draft: { amount: number; where: string; label: string }): boolean {
  return draft.amount === 0 && draft.where.trim() === "" && draft.label.trim() === "";
}
