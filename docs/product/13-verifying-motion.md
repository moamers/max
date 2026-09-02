# Verifying motion

Motion is the one thing in this app that **cannot be verified by a test**, and
the way it fails is silent.

`--motion-deliberate: 320ms` in `globals.css` is normalised by the CSS minifier
to `.32s` in the built stylesheet. Reading that with `parseFloat` gives `0.32`,
used as milliseconds: every animation started, finished inside a third of a
millisecond, and left the correct end state on screen. Two motion features
shipped that way. `tsc`, `lint`, `vitest` and `build` were all clean. Counting
`document.getAnimations()` said the animations existed. Screenshots at rest
looked right. Nothing was wrong except that nothing moved.

It was found by photographing an animation **in flight**. That is the only
check that means anything here.

## The rules that follow

1. **Read a duration with `motionToken()`** (`src/lib/motion.ts`), never
   `parseFloat`. Pinned by `src/lib/__tests__/motion-token-units.test.ts`.
2. **A motion change is not verified until a frame of it has been seen
   mid-flight.** Not "the animation object exists". Not "the end state is
   correct". A frame, with the element part-way between its two positions.
3. **Put a stable hook on anything that animates** — `data-motion-row`,
   `data-arrival`, `data-half` — so a probe can find it. Matching on inline
   style text is brittle and silently matches nothing.

## The harness, and the four things that waste an hour without it

- **Chromium must be launched as a tracked background process.** A `( … & )`
  subshell is reaped when the shell call ends; the symptom is a browser that
  runs, stays alive, logs nothing and never binds its debug port. It looks like
  a broken browser and is not.
- **Poll for the animation; never sleep a guessed number of milliseconds.**
  Dev-mode hydration is slow and variable, and the window is a few hundred
  milliseconds wide. Warm the route first so compilation is not inside it.
- **Stretch time with CPU throttling** (`Emulation.setCPUThrottlingRate`).
  Injecting slower CSS tokens does not work — Next's stylesheet loads
  afterwards and wins — and changing the app's own timings means photographing
  something other than what ships.
- **React StrictMode double-invokes effects in development.** An effect that
  records "done" on its first pass gets undone by its second, and because the
  end state is identical, nothing gives it away. `Arrival.tsx` shows the guard.

## Production isolation

`.env.local` holds production credentials. It is moved aside, never edited in
place, and restored byte-identically against a recorded `sha256sum` — with the
restore *verified*, not assumed. A dev server left running while the file is
restored is a dev server pointed at production: stop it first.

## The Fold: what was tried, and where it stopped

Scope changes (Week ↔ Month ↔ Year) cross a route boundary, so nothing can
morph across them by accident. The obvious route is React's `<ViewTransition>`,
which Next 16 documents as working in the App Router with no configuration.

**It does not fire here.** Measured on Next 16.3.0 / React 19.2.8: navigating
between scopes calls `document.startViewTransition` **zero** times. That is the
check to run first — hook the method, count the calls — because it separates
"the animation is wrong" from "no transition is happening", and every CSS
question is downstream of it.

Ruled out, so nobody repeats them:

- The browser supports it: `document.startViewTransition` is a function.
- The API is present: both `ViewTransition` and `addTransitionType` are
  exported by the React that Next bundles, on stable and experimental.
- Next forwards the prop: `Link`'s `transitionTypes` reaches
  `addTransitionType` in `app-router-instance.js`.
- Placement was wrong once and is now right: a `<ViewTransition>` pairs by
  position in the React tree, so one wrapper per route gave React three
  unrelated transitions and nothing to pair. It belongs in the root layout.
  Fixing that changed nothing, which is how we know it is not the cause.

Remaining suspect: the renderer. Next's compiled stable `react-dom` has 10
references to `startViewTransition` against 19 in `react-dom-experimental`,
which points at the component being a passthrough on the stable channel. No
supported flag for switching channels appears in `config-schema` or
`config-shared`.

**The fallback, if the native path stays shut:** a hand-rolled FLIP.
`flyAmountToItsRow()` in `src/lib/motion.ts` already flies a node across a
route change in this app and is the working precedent. `foldDirection()`, the
`::view-transition-*` keyframes and the nav's link tagging all survive that
change — only `ScopeFold.tsx` is replaced.
