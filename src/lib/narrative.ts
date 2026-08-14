/**
 * Turns computed figures into plain sentences.
 *
 * T-2: every number here arrives pre-computed. This module chooses *which*
 * facts are worth saying and phrases them — it does not calculate.
 * T-11: deterministic, so it is unit-testable and works with no model.
 * B-20: at most a few observations; an unremarkable period should say little.
 */

import type { InsightsResponse } from "./insights";
import { assertToneCompliant } from "./tone";

export interface WeeklyTotal {
  weekNumber: number;
  total: number;
}

export interface SectionTotals {
  bills: number;
  extras: number;
  grocery: number;
  weekend: number;
  transport: number;
}

export interface TagTotal {
  tag: string;
  section: string;
  total: number;
  count: number;
}

export interface NarrativeSentence {
  /** Stable id so the doctrine tests can target individual sentences. */
  id: string;
  text: string;
  /** B-8: provenance travels with the sentence; the UI hedges `inference`. */
  provenance: "fact" | "inference";
  /** Notability. Higher wins when trimming to the top few. */
  weight: number;
}

export interface NarrativeInput {
  periodLabel: string;
  income: number;
  sections: SectionTotals;
  weeks: WeeklyTotal[];
  tags: TagTotal[];
  insights: InsightsResponse;
}

const gbp = (n: number) => `£${Math.round(n).toLocaleString("en-GB")}`;

function ordinalWeek(n: number) {
  return `week ${n}`;
}

/**
 * Signal detectors. Each returns a sentence or null. Weights are rough
 * notability scores — the point is ordering, not precision.
 */
function weekSpread(input: NarrativeInput): NarrativeSentence | null {
  const weeks = input.weeks.filter((w) => w.total > 0);
  if (weeks.length < 3) return null;

  const sorted = [...weeks].sort((a, b) => a.total - b.total);
  const low = sorted[0];
  const high = sorted[sorted.length - 1];
  if (low.total <= 0) return null;

  const ratio = high.total / low.total;
  if (ratio < 1.4) return null;

  return {
    id: "week-spread",
    text: `Your weeks ranged from about ${gbp(low.total)} to ${gbp(high.total)} — ${ordinalWeek(
      high.weekNumber
    )} was the biggest.`,
    provenance: "fact",
    weight: Math.min(ratio, 4) * 25,
  };
}

function weekTrend(input: NarrativeInput): NarrativeSentence | null {
  const weeks = [...input.weeks].filter((w) => w.total > 0).sort((a, b) => a.weekNumber - b.weekNumber);
  if (weeks.length < 3) return null;

  const tail = weeks.slice(-3);
  const rising = tail[0].total < tail[1].total && tail[1].total < tail[2].total;
  if (!rising) return null;
  if (tail[2].total < tail[0].total * 1.25) return null;

  return {
    id: "week-trend",
    text: `The last three weeks climbed steadily — ${gbp(tail[0].total)}, then ${gbp(
      tail[1].total
    )}, then ${gbp(tail[2].total)}.`,
    provenance: "fact",
    weight: 80,
  };
}

function tagConcentration(input: NarrativeInput): NarrativeSentence | null {
  const named = input.tags.filter((t) => t.tag && t.tag !== "(untagged)");
  if (named.length === 0) return null;

  const top = [...named].sort((a, b) => b.total - a.total)[0];
  const sectionTotal =
    top.section === "extras" ? input.sections.extras : input.sections[top.section as keyof SectionTotals] ?? 0;
  if (sectionTotal <= 0) return null;

  const share = top.total / sectionTotal;
  if (share < 0.35 || top.total < 100) return null;

  return {
    id: "tag-concentration",
    text: `Most of the one-off spending was tagged “${top.tag}” — about ${gbp(top.total)} across ${
      top.count
    } ${top.count === 1 ? "item" : "items"}.`,
    provenance: "fact",
    weight: 60 + share * 40,
  };
}

function weekdayVsWeekend(input: NarrativeInput): NarrativeSentence | null {
  const weekday = input.sections.grocery + input.sections.transport;
  const weekend = input.sections.weekend;
  if (weekday <= 0 || weekend <= 0) return null;

  return {
    id: "weekday-vs-weekend",
    text: `Weekday running costs came to about ${gbp(weekday)}, and weekends about ${gbp(weekend)}.`,
    provenance: "fact",
    weight: 30,
  };
}

/**
 * B-9 / B-8: when recorded income looks like it may be partial, ask rather
 * than assert a deficit — every downstream figure depends on the answer, and
 * stating "you are short by £X" from possibly-incomplete input would be an
 * inference dressed as a fact.
 */
function incomeLooksPartial(input: NarrativeInput): NarrativeSentence | null {
  const out =
    input.sections.bills +
    input.sections.extras +
    input.sections.grocery +
    input.sections.weekend +
    input.sections.transport;
  if (input.income <= 0 || out <= 0) return null;
  if (out < input.income * 1.5) return null;

  return {
    id: "income-partial",
    text: `The sheet records ${gbp(input.income)} coming in for this period. Is that the whole picture, or just part of it?`,
    provenance: "inference",
    weight: 95,
  };
}

/** Cross-period comparison — only meaningful once there is history. */
function versusUsual(input: NarrativeInput): NarrativeSentence | null {
  const { insights } = input;
  if (insights.historyCount < 1) return null;

  const ranked = insights.metrics
    .filter((m) => m.delta !== null && Math.abs(m.delta) > 0.02)
    .sort((a, b) => Math.abs(b.delta!) - Math.abs(a.delta!));
  if (ranked.length === 0) return null;

  const m = ranked[0];
  const direction = m.delta! > 0 ? "higher" : "lower";
  const label = m.label.toLowerCase();

  return {
    id: "versus-usual",
    text: `${label[0].toUpperCase()}${label.slice(1)} ran ${(Math.abs(m.delta!) * 100).toFixed(
      0
    )}% ${direction} than your usual period.`,
    provenance: "fact",
    weight: 70 + Math.abs(m.delta!) * 100,
  };
}

const DETECTORS = [
  incomeLooksPartial,
  weekTrend,
  weekSpread,
  versusUsual,
  tagConcentration,
  weekdayVsWeekend,
];

/**
 * Returns the most notable few sentences, highest weight first.
 * Returns an empty array when there is nothing worth saying — an ordinary
 * period deserves an ordinary response, and silence beats a manufactured
 * observation.
 */
export function buildNarrative(input: NarrativeInput, max = 3): NarrativeSentence[] {
  const found = DETECTORS.map((d) => d(input)).filter((s): s is NarrativeSentence => s !== null);

  for (const s of found) assertToneCompliant(s.text, `narrative:${s.id}`);

  return found.sort((a, b) => b.weight - a.weight).slice(0, max);
}
