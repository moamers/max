/**
 * The yellow rule, stated as examples.
 *
 * This is the classifier the import leans on to decide that a row the user
 * coloured in means "this hasn't gone out yet". Getting it wrong in the
 * permissive direction marks a settled bill unsettled, so the cases that must
 * be rejected are as load-bearing as the ones that must be accepted.
 */
import { describe, expect, it } from "vitest";
import type ExcelJS from "exceljs";
import { colourToRgb, isYellowFill, isYellowRgb } from "../cell-fill";

function solid(colour: Record<string, unknown>): ExcelJS.Fill {
  return { type: "pattern", pattern: "solid", fgColor: colour } as ExcelJS.Fill;
}

describe("colourToRgb", () => {
  it("reads an 8-digit ARGB", () => {
    expect(colourToRgb({ argb: "FFFFFF00" })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it("reads a 6-digit RGB", () => {
    expect(colourToRgb({ argb: "FFFF00" })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it("refuses a mostly transparent colour rather than guessing what shows through", () => {
    expect(colourToRgb({ argb: "00FFFF00" })).toBeNull();
    expect(colourToRgb({ argb: "40FFFF00" })).toBeNull();
    // Half-opaque and up is a colour someone can actually see.
    expect(colourToRgb({ argb: "80FFFF00" })).toEqual({ r: 255, g: 255, b: 0 });
  });

  it("resolves an indexed colour through the default palette", () => {
    expect(colourToRgb({ indexed: 13 })).toEqual({ r: 255, g: 255, b: 0 });
    expect(colourToRgb({ indexed: 5 })).toEqual({ r: 255, g: 255, b: 0 });
    expect(colourToRgb({ indexed: 22 })).toEqual({ r: 192, g: 192, b: 192 });
  });

  it("refuses a theme colour, which only the workbook's own theme can resolve", () => {
    expect(colourToRgb({ theme: 4, tint: -0.2 })).toBeNull();
  });

  it("refuses nonsense rather than half-reading it", () => {
    expect(colourToRgb(undefined)).toBeNull();
    expect(colourToRgb({})).toBeNull();
    expect(colourToRgb({ argb: "" })).toBeNull();
    expect(colourToRgb({ argb: "zzzzzz" })).toBeNull();
    expect(colourToRgb({ argb: "FFF" })).toBeNull();
    expect(colourToRgb({ indexed: 999 })).toBeNull();
  });
});

describe("isYellowRgb", () => {
  it.each([
    ["FFFF00 · Excel's Yellow", { r: 255, g: 255, b: 0 }],
    ["FFFFCC · pale yellow", { r: 255, g: 255, b: 204 }],
    ["FFEB9C · the Neutral cell style", { r: 255, g: 235, b: 156 }],
    ["FFFF99 · indexed 43", { r: 255, g: 255, b: 153 }],
    ["FFD966 · gold, lighter 40%", { r: 255, g: 217, b: 102 }],
  ])("accepts %s", (_name, rgb) => {
    expect(isYellowRgb(rgb)).toBe(true);
  });

  it.each([
    ["FFC000 · Excel calls this Orange", { r: 255, g: 192, b: 0 }],
    ["FF9900 · the budget rows in the founder's own sheet", { r: 255, g: 153, b: 0 }],
    ["ED7D31 · the orange Ravel writes on export", { r: 237, g: 125, b: 49 }],
    ["FFFFFF · white", { r: 255, g: 255, b: 255 }],
    ["FFFFF2 · near-white", { r: 255, g: 255, b: 242 }],
    ["D9D9D9 · grey", { r: 217, g: 217, b: 217 }],
    ["92D050 · light green", { r: 146, g: 208, b: 80 }],
    ["808000 · olive, too dark to be a highlight", { r: 128, g: 128, b: 0 }],
    ["000000 · black", { r: 0, g: 0, b: 0 }],
  ])("rejects %s", (_name, rgb) => {
    expect(isYellowRgb(rgb)).toBe(false);
  });

  it("rejects an unresolved colour", () => {
    expect(isYellowRgb(null)).toBe(false);
  });
});

describe("isYellowFill", () => {
  it("accepts a solid yellow", () => {
    expect(isYellowFill(solid({ argb: "FFFFFF00" }))).toBe(true);
    expect(isYellowFill(solid({ indexed: 13 }))).toBe(true);
  });

  it("treats an absent or empty fill as not highlighted", () => {
    expect(isYellowFill(undefined)).toBe(false);
    expect(isYellowFill(null)).toBe(false);
    expect(isYellowFill({ type: "pattern", pattern: "none" } as ExcelJS.Fill)).toBe(false);
  });

  it("declines a patterned fill, whose rendered colour is a blend", () => {
    expect(
      isYellowFill({
        type: "pattern",
        pattern: "darkVertical",
        fgColor: { argb: "FFFFFF00" },
        bgColor: { argb: "FFFFFFFF" },
      } as ExcelJS.Fill)
    ).toBe(false);
  });

  it("declines a gradient, which has no single colour to classify", () => {
    expect(
      isYellowFill({
        type: "gradient",
        gradient: "angle",
        degree: 0,
        stops: [
          { position: 0, color: { argb: "FFFFFF00" } },
          { position: 1, color: { argb: "FFFFFF00" } },
        ],
      } as ExcelJS.Fill)
    ).toBe(false);
  });
});
