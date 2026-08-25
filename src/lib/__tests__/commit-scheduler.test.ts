/**
 * These pin the timing rules that a real outage produced. The goals screen
 * called a server action from a controlled input's onChange, so typing "260"
 * fired three writes and nine route revalidations — enough to take the page
 * down. The rules below are what stops that recurring.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createCommitScheduler, COMMIT_DELAY_MS } from "../commit-scheduler";
import { sanitizeNumericInput } from "../../components/ui/NumericField";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("commit scheduler", () => {
  it("writes once for a burst of keystrokes, with the last value", () => {
    const written: number[] = [];
    const s = createCommitScheduler();

    // Someone typing "260" into an empty field.
    for (const value of [2, 26, 260]) s.schedule("goal:everyday", () => written.push(value));

    expect(written).toEqual([]);
    vi.advanceTimersByTime(COMMIT_DELAY_MS);
    expect(written).toEqual([260]);
  });

  it("does not write while the user is still typing", () => {
    const written: number[] = [];
    const s = createCommitScheduler();

    s.schedule("k", () => written.push(1));
    vi.advanceTimersByTime(COMMIT_DELAY_MS - 1);
    s.schedule("k", () => written.push(2));
    vi.advanceTimersByTime(COMMIT_DELAY_MS - 1);
    expect(written).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(written).toEqual([2]);
  });

  it("keeps separate fields separate", () => {
    const written: string[] = [];
    const s = createCommitScheduler();

    // Editing one target then another must not cancel the first.
    s.schedule("goal:everyday", () => written.push("everyday"));
    s.schedule("goal:weekend", () => written.push("weekend"));

    vi.advanceTimersByTime(COMMIT_DELAY_MS);
    expect(written.sort()).toEqual(["everyday", "weekend"]);
  });

  it("writes pending edits on flushAll rather than losing them", () => {
    const written: string[] = [];
    const s = createCommitScheduler();
    s.schedule("a", () => written.push("a"));
    s.schedule("b", () => written.push("b"));

    // What happens when the sheet closes mid-edit.
    s.flushAll();
    expect(written.sort()).toEqual(["a", "b"]);
    expect(s.pendingCount()).toBe(0);

    // And the timers must not fire a second time afterwards.
    vi.advanceTimersByTime(COMMIT_DELAY_MS * 2);
    expect(written).toHaveLength(2);
  });

  it("drops everything on cancelAll", () => {
    const written: string[] = [];
    const s = createCommitScheduler();
    s.schedule("a", () => written.push("a"));
    s.cancelAll();
    vi.advanceTimersByTime(COMMIT_DELAY_MS * 2);
    expect(written).toEqual([]);
  });

  it("reports what is still waiting", () => {
    const s = createCommitScheduler();
    expect(s.pendingCount()).toBe(0);
    s.schedule("a", () => {});
    s.schedule("b", () => {});
    s.schedule("a", () => {});
    expect(s.pendingCount()).toBe(2);
    vi.advanceTimersByTime(COMMIT_DELAY_MS);
    expect(s.pendingCount()).toBe(0);
  });
});

describe("money input accepts pence", () => {
  it("keeps two decimal places", () => {
    expect(sanitizeNumericInput("28.65")).toBe(28.65);
    expect(sanitizeNumericInput("96.76")).toBe(96.76);
  });

  it("still handles whole pounds and empty input", () => {
    expect(sanitizeNumericInput("260")).toBe(260);
    expect(sanitizeNumericInput("")).toBe(0);
  });

  it("strips currency symbols and stray characters", () => {
    expect(sanitizeNumericInput("£1,234.50")).toBe(1234.5);
  });

  it("treats a second point as a typo rather than losing what follows", () => {
    expect(sanitizeNumericInput("12.3.4")).toBe(12.34);
  });

  it("truncates beyond pence rather than rounding up a third digit", () => {
    expect(sanitizeNumericInput("10.999")).toBe(10.99);
  });

  it("survives a lone decimal point mid-typing", () => {
    expect(sanitizeNumericInput(".")).toBe(0);
    expect(sanitizeNumericInput(".5")).toBe(0.5);
  });
});
