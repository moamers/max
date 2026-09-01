import { Button } from "@/components/ui/Button";
import { StartFirstPeriod } from "@/components/StartFirstPeriod";
import { dominantMonth, proposeFirstPeriod } from "@/lib/periods";

const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

/**
 * Shared first-import state for every period-backed main screen.
 *
 * Offers both routes in (#46): import a file, or start a month now and type
 * transactions straight in. Neither writes anything until it is pressed —
 * `proposeFirstPeriod` is pure date arithmetic, so rendering this screen
 * proposes a month without creating one.
 */
export function EmptyState() {
  const proposal = proposeFirstPeriod();
  const month = MONTH.format(
    dominantMonth(new Date(`${proposal.startDate}T00:00:00Z`), new Date(`${proposal.endDate}T00:00:00Z`))
  );

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: "20px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "var(--type-title)", fontWeight: 800, letterSpacing: "-0.02em", margin: 0 }}>
        Nothing imported yet
      </p>
      <p style={{ fontSize: "var(--type-body)", color: "var(--text-secondary)", margin: 0, maxWidth: 320 }}>
        Bring in a spreadsheet or statement and Ravel will build your first month here.
      </p>
      <Button
        href="/import"
        style={{
          maxWidth: 280,
        }}
      >
        Import a file
      </Button>
      <StartFirstPeriod label={month} />
    </div>
  );
}
