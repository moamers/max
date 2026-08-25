import { describe, it, expect } from "vitest";
import { formatGBP, formatGBPApprox, formatSignedGBP, formatMoney } from "../money";

describe("formatGBP", () => {
  it("keeps pence when the figure has them", () => {
    expect(formatGBP(294.33)).toBe("£294.33");
    expect(formatGBP(12.65)).toBe("£12.65");
  });

  it("drops the decimals when there are none to show", () => {
    expect(formatGBP(260)).toBe("£260");
  });

  it("never rounds a figure the user could check against a statement", () => {
    // The week detail used to render this as "£397", against a dashboard
    // showing "£396.60" for the same week.
    expect(formatGBP(396.6)).toBe("£396.60");
  });

  it("groups thousands", () => {
    expect(formatGBP(3745.33)).toBe("£3,745.33");
  });

  it("signs negatives", () => {
    expect(formatGBP(-34.33)).toBe("-£34.33");
  });
});

describe("the items in a category sum to the category header", () => {
  // The reported "mismatch" was two TFL fares of £12.65 rendering as "£13"
  // each beside a header that had rounded the other way.
  const items = [12.65, 12.65, 9.4];
  const total = items.reduce((a, b) => a + b, 0);

  it("shows parts and total at the same precision", () => {
    expect(items.map(formatGBP)).toEqual(["£12.65", "£12.65", "£9.40"]);
    expect(formatGBP(total)).toBe("£34.70");
  });
});

describe("formatGBPApprox", () => {
  it("rounds to whole pounds, for copy that says 'about'", () => {
    expect(formatGBPApprox(396.6)).toBe("£397");
    expect(formatGBPApprox(1234.4)).toBe("£1,234");
  });
});

describe("formatSignedGBP", () => {
  it("always carries a sign", () => {
    expect(formatSignedGBP(1108)).toBe("+£1,108");
    expect(formatSignedGBP(-240.5)).toBe("-£240.50");
    expect(formatSignedGBP(0)).toBe("+£0");
  });
});

describe("formatMoney", () => {
  it("matches formatGBP for positives", () => {
    expect(formatMoney(294.33)).toBe(formatGBP(294.33));
    expect(formatMoney(260)).toBe(formatGBP(260));
  });

  it("uses a typographic minus for negatives", () => {
    expect(formatMoney(-240.5)).toBe("−£240.50");
  });
});
