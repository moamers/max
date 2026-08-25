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
 */
export function JustChanged({ active, children }: { active: boolean; children: React.ReactNode }) {
  if (!active) return <>{children}</>;
  return <div className="just-changed">{children}</div>;
}
