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
