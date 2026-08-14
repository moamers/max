/**
 * T-2: the "LLM as compiler, not interpreter" seam.
 *
 * Working out what an unfamiliar workbook *means* is a judgement call, and
 * judgement is what a model is for. But that judgement must not be re-made on
 * every read — the same file has to produce the same numbers every time.
 *
 * So the judgement happens once and its *output* is this mapping: a small,
 * inspectable, serialisable plan. Applying the plan is pure deterministic code.
 *
 * Today the plan is derived by rules (`detectByRules`). An LLM detector can be
 * slotted in behind the same interface without touching anything downstream —
 * it produces a WorkbookMapping, it does not produce numbers.
 */

export type SheetRole =
  | { kind: "period-summary" }
  | { kind: "week"; weekNumber: number }
  | { kind: "ignore"; reason: string };

export interface SheetPlan {
  sheetName: string;
  role: SheetRole;
}

export interface WorkbookMapping {
  /**
   * `workbook-is-period` — the whole file is one pay period, with a summary
   * sheet and/or one sheet per week. This is the real-world layout.
   * `sheet-is-period` — each sheet is its own period. Legacy/fallback.
   */
  strategy: "workbook-is-period" | "sheet-is-period";
  /** Period label when the workbook is one period. Null means derive per sheet. */
  periodLabel: string | null;
  sheets: SheetPlan[];
  derivedBy: "rules" | "llm";
  /** Low confidence is a signal to ask the user one question (B-9 / T-8), not to guess louder. */
  confidence: "high" | "low";
  notes: string[];
}

const WEEK_SHEET = /^\s*wk?\s*[-. ]?\s*(\d{1,2})\b|^\s*week\s*[-. ]?\s*(\d{1,2})\b/i;
const SUMMARY_SHEET = /summary|overview|totals?\b/i;
const IGNORE_SHEET = /aggregate|instructions?|readme|template|notes?$/i;

/** Strips the extension and tidies a filename into a period label. */
export function labelFromFileName(fileName: string): string {
  return fileName
    .replace(/\.(xlsx|xlsm|xls|csv)$/i, "")
    .replace(/[_]+/g, " ")
    .trim();
}

function weekNumberFrom(sheetName: string): number | null {
  const m = WEEK_SHEET.exec(sheetName);
  if (!m) return null;
  const digits = m[1] ?? m[2];
  const n = Number(digits);
  return Number.isInteger(n) && n >= 1 && n <= 53 ? n : null;
}

/**
 * Deterministic structure detection. Deliberately conservative: it only claims
 * `workbook-is-period` when it can actually see week sheets, because getting
 * this wrong is exactly the F-1 defect.
 */
export function detectByRules(sheetNames: string[], fileName: string): WorkbookMapping {
  const notes: string[] = [];
  const sheets: SheetPlan[] = sheetNames.map((sheetName) => {
    if (IGNORE_SHEET.test(sheetName)) {
      return { sheetName, role: { kind: "ignore", reason: "non-data sheet" } as SheetRole };
    }
    const week = weekNumberFrom(sheetName);
    if (week !== null) {
      return { sheetName, role: { kind: "week", weekNumber: week } as SheetRole };
    }
    if (SUMMARY_SHEET.test(sheetName)) {
      return { sheetName, role: { kind: "period-summary" } as SheetRole };
    }
    return { sheetName, role: { kind: "period-summary" } as SheetRole };
  });

  const weekSheets = sheets.filter((s) => s.role.kind === "week");

  if (weekSheets.length > 0) {
    const seen = new Set<number>();
    for (const s of weekSheets) {
      if (s.role.kind !== "week") continue;
      if (seen.has(s.role.weekNumber)) {
        notes.push(`Duplicate week number ${s.role.weekNumber} — sheets may be mislabelled.`);
      }
      seen.add(s.role.weekNumber);
    }
    return {
      strategy: "workbook-is-period",
      periodLabel: labelFromFileName(fileName),
      sheets,
      derivedBy: "rules",
      confidence: notes.length === 0 ? "high" : "low",
      notes,
    };
  }

  // No week sheets: fall back to treating each sheet as its own period.
  notes.push("No week-shaped sheet names found; treating each sheet as its own period.");
  return {
    strategy: "sheet-is-period",
    periodLabel: null,
    sheets: sheets.map((s) =>
      s.role.kind === "ignore" ? s : { ...s, role: { kind: "period-summary" } as SheetRole }
    ),
    derivedBy: "rules",
    confidence: "low",
    notes,
  };
}

export type MappingDetector = (sheetNames: string[], fileName: string) => WorkbookMapping;

/** Swap point for an LLM-backed detector. It returns a plan; it never returns numbers. */
export const detectWorkbookMapping: MappingDetector = detectByRules;
