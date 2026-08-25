/**
 * The aggregate reads the V1 screens render.
 *
 * Same rule as `store.ts` and for the same reason: every exported function
 * takes a `UserId` first, and every statement filters on `periods.user_id` or
 * on the row's own `user_id`. There is no unscoped variant of any of them.
 */
export { periodWindow, type PeriodWindow } from "./period-window";
export {
  listPeriodsMeta,
  pickCurrentPeriodId,
  findPeriod,
  periodParamValue,
  resolveSummaryOrderedPeriodId,
  type PeriodMeta,
  type PeriodSearchParams,
  type ExplicitPeriodPolicy,
} from "./period-meta";
export { incomeForPeriod, type PeriodIncome, type IncomeSource } from "./income";
export { monthOverview, type MonthOverview, type MonthTotals } from "./month";
export { weeklyBreakdown, type WeekTotals, type WeeklyCategoryTotal } from "./weeks";
export {
  recurringForPeriod,
  oneOffsForPeriod,
  recurringTotalsByCategory,
  type RecurringBreakdown,
  type RecurringGroup,
  type OneOffs,
  type TransactionRow,
} from "./recurring";
export * from "./year";
