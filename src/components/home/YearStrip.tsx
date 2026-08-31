import Link from "next/link";
import { formatSignedGBP } from "./format";
import type { YearView } from "./types";

const WIDTH = 160;
const HEIGHT = 40;
const BASELINE_Y = 30;

/** 2px lime polyline of cumulative net position, over a dashed zero line — README 02.6. */
function Sparkline({ values }: { values: number[] }) {
  const maxAbs = Math.max(1, ...values.map((v) => Math.abs(v)));
  const points = values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * WIDTH : WIDTH / 2;
      const y = Math.min(HEIGHT - 3, Math.max(3, BASELINE_Y - (v / maxAbs) * 22));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ width: WIDTH, height: HEIGHT, marginLeft: "auto", display: "block" }} aria-hidden>
      <line x1={0} y1={BASELINE_Y} x2={WIDTH} y2={BASELINE_Y} stroke="var(--hairline-2)" strokeWidth={1} strokeDasharray="3 4" />
      {values.length > 1 && <polyline points={points} fill="none" stroke="var(--lime-ink)" strokeWidth={2} strokeLinejoin="round" />}
    </svg>
  );
}

export function YearStrip({ year }: { year: YearView }) {
  return (
    <Link
      href="/year"
      style={{
        color: "inherit",
        textDecoration: "none",
        border: "1px solid var(--hairline-2)",
        borderRadius: "var(--radius-card-lg)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        <span
          style={{
            fontFamily: "var(--font-jetbrains-mono)",
            fontSize: 10,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--text-tertiary)",
          }}
        >
          {year.year} net position
        </span>
        <span
          style={{
            fontSize: 19,
            fontWeight: 700,
            letterSpacing: "-0.025em",
            color: year.netPosition === null || year.netPosition >= 0 ? "var(--lime-ink)" : "var(--bar-over)",
          }}
        >
          {year.netPosition === null ? "—" : formatSignedGBP(year.netPosition)}
        </span>
      </div>
      <Sparkline values={year.sparkline} />
    </Link>
  );
}
