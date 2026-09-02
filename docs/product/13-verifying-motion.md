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

## Two things about the harness that cost an hour each

- **Serve the dev server over `localhost`, not `127.0.0.1`.** Next 16 blocks
  cross-origin access to dev resources, and it does not consider those two the
  same origin. The symptom is not an error: the page renders perfectly,
  server-side, and never hydrates. No React fibers on any element, every link a
  full page load, and every client-side moment silently absent. Check
  `Object.keys(el).filter(k => k.startsWith('__react'))` before believing
  anything about interactivity.
- **Headless Chromium is at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`.** There is no
  `chromium` on the path.

To slow a moment down for the camera, use CDP's
`Animation.setPlaybackRate` — it replays the real animation, at its real
durations, more slowly. Rewriting the app's own timings photographs something
other than what ships.

## The Fold: how it works, and how it was verified

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
- Placement was wrong once: a `ViewTransition` pairs by position in the React
  tree, so one wrapper per route gave React three unrelated transitions and
  nothing to pair. Moving it to the root layout fixed that and changed nothing,
  which is how we know it is not the cause.

Remaining suspect: the renderer. Next's compiled stable `react-dom` has 10
references to `startViewTransition` against 19 in `react-dom-experimental`,
which points at the component being a passthrough on the stable channel. No
supported flag for switching channels appears in `config-schema` or
`config-shared`.

**So it is hand-rolled**, in `src/components/nav/fold-runtime.ts`. A route
change destroys the outgoing screen before the incoming one exists, so the
answer is to photograph it before letting go: `FoldLink` clones the live screen
on the press and lays the copy over the top; `ScopeFold` — one instance in the
root layout, the only component that survives a route change — plays that copy
off when the pathname changes and folds the new screen's body in behind it.

### What was measured

Sampled every animation frame from inside the page (a CDP round trip is ~50ms
and the whole fold is 360ms, so polling from outside sees four points at best):

```
   10ms  path=/      ghost opacity 1                  ← photograph taken on the press
  130ms  path=/year  ghost opacity 1   body opacity 0 ← navigation lands, fold starts
  190ms  path=/year  ghost 0.862 scale 0.9952
  240ms  path=/year  ghost 0.459 scale 0.9810
  273ms  path=/year  ghost gone        body opacity 0.42
  590ms  path=/year                    body opacity 1
```

Seven frames part-way through, per fold, in real time — not one, and not a
third of a millisecond. Month → Year scales the photograph **down** to 0.965;
Year → Month scales it **up** to 1/0.965. Week ↔ Month ↔ Year all fold;
Settings folds neither way and strands nothing; browser back is a plain cut,
because there is no press for it to have photographed.

Photographed at 1/12 speed: `fold-out-mid`, `fold-in-mid`, `fold-week-mid`.

### Two bugs the photographs caught that the tests could not

1. **The photograph was blank.** `playFold` folds in every `[data-fold-body]`
   in the document — and a clone of the screen contains one of its own, so the
   copy was being animated as the *arriving* screen and sat at opacity 0 for
   the whole of its own exit. The fold ran perfectly and photographed an empty
   room. `captureFold` now strips the attribute from the copy.
2. **The photograph moved.** `cloneNode` copies classes, so the week screen's
   `.max-sheet--full` restarted `sheetUp` on the copy and slid the still image
   up from below while it faded. Killed with `animation: none !important` on
   the ghost subtree in `globals.css`.

### The one thing this cannot animate

The nav pill. It is persistent chrome and must not scale or fade, so the fold
lands on `[data-fold-body]` — marked per screen — rather than on the screen
root. Two reasons, and the second is the sharp one: a transform on an ancestor
of the pill would scale it, *and* re-anchor it, because a `position: fixed`
descendant of a transformed element is positioned against that element instead
of the viewport. `the-fold.test.ts` pins that the pill sits outside every
`[data-fold-body]` on all four screens.
