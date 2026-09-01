import { LANDING_TARGET } from "@/lib/motion";

/**
 * Marks the one row the user just added or edited.
 *
 * Lists are ordered biggest-amount-first, so a saved row lands wherever its
 * amount falls rather than at the top or the bottom. Landing on the right
 * screen is only half of "a change leaves you where you made it" — you also
 * have to be able to see what changed.
 *
 * The styling lives in globals.css (`.just-changed`): a cyan tint that fades
 * over two seconds, and holds steady instead of fading for anyone who has
 * asked for reduced motion.
 *
 * It is also where THE LANDING ends. The chip that lifts out of the add form
 * flies to `[data-landing-target]`, which is this — the row the destination
 * screen has already worked out is the one that changed. The Landing composes
 * with this mark rather than inventing a second way of finding the same row,
 * and while a chip is in the air the mark holds still (`[data-landing]`) so
 * its two seconds start when the chip arrives rather than when the screen did.
 */
export function JustChanged({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (!active) return <>{children}</>;
  return (
    <div className="just-changed" {...{ [LANDING_TARGET]: "" }}>
      {children}
    </div>
  );
}
