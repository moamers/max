import type { LineItemRow } from "@/lib/store";

/**
 * Every number on this page can be opened up to show what it means and which
 * of the user's own rows it came from.
 *
 * B-8 says provenance travels with a figure. Keeping that internal isn't enough
 * for someone who doesn't trust money claims by default — so provenance is
 * rendered. Uses <details> so it works with no JavaScript.
 */

const gbp = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 });

const gbpExact = (n: number) =>
  n.toLocaleString("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 });

export interface Bucket {
  key: string;
  /** Plain English, not the internal section name. */
  label: string;
  amount: number;
  /** What this is, in a sentence. */
  meaning: string;
  /** Where in their spreadsheet it came from. */
  origin: string;
  items: LineItemRow[];
  /** Optional extra breakdown, e.g. week-by-week. */
  breakdown?: { label: string; amount: number }[];
  /** Rendered in a quieter tone — used for the income caveat. */
  caveat?: string;
}

function ItemList({ items }: { items: LineItemRow[] }) {
  const shown = items.slice(0, 8);
  const rest = items.length - shown.length;

  return (
    <>
      <ul className="mt-3 space-y-1">
        {shown.map((i) => (
          <li key={i.id} className="flex justify-between gap-4 text-sm">
            <span style={{ color: "var(--text-secondary)" }}>
              {i.description ?? "—"}
              {i.tag ? (
                <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  {i.tag}
                </span>
              ) : null}
              {i.note ? (
                <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  ({i.note})
                </span>
              ) : null}
            </span>
            <span className="tabular-nums whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>
              {gbpExact(i.amount)}
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 && (
        <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
          …and {rest} more {rest === 1 ? "item" : "items"}.
        </p>
      )}
    </>
  );
}

export function WhereItWent({ buckets, title }: { buckets: Bucket[]; title: string }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
        {title}
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        Tap any line to see what it means and where it came from.
      </p>

      <div className="rounded-lg border overflow-hidden" style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
        {buckets.map((b, idx) => (
          <details
            key={b.key}
            className="group"
            style={{ borderTop: idx === 0 ? "none" : "1px solid var(--gridline)" }}
          >
            <summary className="flex justify-between items-center gap-4 px-4 py-4 cursor-pointer list-none">
              <span className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="inline-block transition-transform group-open:rotate-90"
                  style={{ color: "var(--text-muted)" }}
                >
                  ›
                </span>
                <span style={{ color: "var(--text-primary)" }}>{b.label}</span>
              </span>
              <span className="text-lg font-semibold tabular-nums whitespace-nowrap">{gbp(b.amount)}</span>
            </summary>

            <div className="px-4 pb-5 pl-10">
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {b.meaning}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                {b.origin}
              </p>

              {b.caveat && (
                <p className="text-sm mt-3" style={{ color: "var(--text-secondary)" }}>
                  {b.caveat}
                </p>
              )}

              {b.breakdown && b.breakdown.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {b.breakdown.map((r) => (
                    <li key={r.label} className="flex justify-between gap-4 text-sm">
                      <span style={{ color: "var(--text-secondary)" }}>{r.label}</span>
                      <span className="tabular-nums" style={{ color: "var(--text-secondary)" }}>
                        {gbpExact(r.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {b.items.length > 0 && <ItemList items={b.items} />}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
