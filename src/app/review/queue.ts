export function withoutCurrent<T>(rows: readonly T[]): T[] {
  return rows.slice(1);
}
