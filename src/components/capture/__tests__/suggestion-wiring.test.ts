/**
 * A source scan, not a unit test — because this one passes every unit test.
 *
 * Autocomplete originally found the merchant field by matching its visible
 * label against /^where\b/. It worked, and it would have kept working right up
 * until someone reworded "Where" — at which point the feature switches itself
 * off silently: no error, no failing test, just a field that stops suggesting.
 * Copy is owned by the design handoff and is expected to change.
 *
 * So every field that wants suggestions names the history it wants. The prop is
 * the mechanism; the label sniff is only a fallback.
 */
import fs from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";

const ROOT = path.join(process.cwd(), "src");

/** The merchant fields on the add sheet and the transaction editor. */
const MERCHANT_FIELDS = [
  path.join(ROOT, "app", "add", "AddView.tsx"),
  path.join(ROOT, "app", "transaction", "[id]", "TransactionView.tsx"),
];

/** One `<TextField ... />` element's source, from its tag to its close. */
function textFieldElements(src: string): string[] {
  const elements: string[] = [];
  let from = src.indexOf("<TextField");
  while (from !== -1) {
    const end = src.indexOf("/>", from);
    if (end === -1) break;
    elements.push(src.slice(from, end + 2));
    from = src.indexOf("<TextField", end);
  }
  return elements;
}

describe("a field that wants suggestions says so", () => {
  it.each(MERCHANT_FIELDS.map((f) => [path.relative(ROOT, f), f] as const))(
    "%s asks for merchant history by name, not by its label text",
    (_rel, file) => {
      const elements = textFieldElements(fs.readFileSync(file, "utf8"));
      // Guard the guard: if the parse finds nothing, the assertion below is vacuous.
      expect(elements.length).toBeGreaterThan(0);

      const whereFields = elements.filter((el) => el.includes('label="Where"'));
      expect(whereFields).toHaveLength(1);
      expect(whereFields[0]).toContain('suggestionKind="merchant"');
    }
  );

  it("leaves note and date fields alone", () => {
    // Suggesting past notes would be noise, and a date is not free text.
    for (const file of MERCHANT_FIELDS) {
      const elements = textFieldElements(fs.readFileSync(file, "utf8"));
      for (const el of elements) {
        if (el.includes('label="Note"') || el.includes('label="When"')) {
          expect(el).not.toContain("suggestionKind");
        }
      }
    }
  });
});
