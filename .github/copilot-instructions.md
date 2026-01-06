# Copilot instructions (circadian-ui)

## Project shape / entrypoints
- This is a small TypeScript library built with `tsup` and published as ESM+CJS with types.
- Public exports live in [src/index.ts](../src/index.ts) (core + React + Tailwind). There is also a server-safe entrypoint [src/server.ts](../src/server.ts) for SSR/Next document usage.
- Code is organized by responsibility:
  - [src/core/](../src/core/) is framework-agnostic logic (schedule, sun, tokens, contrast, persistence, system prefs).
  - [src/react/](../src/react/) is the runtime integration (`CircadianProvider`, hooks, and the inline script component).
  - [src/tailwind/](../src/tailwind/) contains the Tailwind preset/plugin that map CSS vars into Tailwind colors.

## Runtime model (how theming works)
- The core contract is: set `data-cui-phase` on the root element and write CSS variables for the resolved tokens.
  - Phase is one of `"dawn" | "day" | "dusk" | "night"` (see [src/core/types.ts](../src/core/types.ts)).
  - CSS vars are defined by `cssVarMap` and produced by `tokensToCssVars` (see [src/core/tokens.ts](../src/core/tokens.ts)).
- For SSR/Next.js, use the inline script to avoid a flash:
  - [src/react/CircadianScript.tsx](../src/react/CircadianScript.tsx) injects `createInlineScript()` from [src/core/script.ts](../src/core/script.ts) to set initial `data-cui-phase` + CSS vars before hydration.
  - After hydration, [src/react/CircadianProvider.tsx](../src/react/CircadianProvider.tsx) computes phase, applies tokens, and schedules updates.

## Phase computation modes
- `mode: "time"` uses schedule windows (see [src/core/schedule.ts](../src/core/schedule.ts): `getPhaseFromTime`, `computeNextTransition`).
- `mode: "sun"` derives schedule windows from a `sunTimesProvider(date)` (see [src/core/sun.ts](../src/core/sun.ts): `getPhaseFromSunTimes`, `getScheduleFromProvider`).
- `mode: "manual"` means the provider uses the `phaseOverride` (see `setPhaseOverride` + `clearOverride` in [src/react/CircadianProvider.tsx](../src/react/CircadianProvider.tsx)).

## Token resolution rules (important when changing core)
- Tokens start from `defaultTokens[phase]`, then per-phase overrides merge in (see `resolveTokens` in [src/core/tokens.ts](../src/core/tokens.ts)).
- If `system.respectColorScheme` is enabled (default), `applyColorSchemeBias()` adjusts lightness based on `prefers-color-scheme` (see [src/core/tokens.ts](../src/core/tokens.ts)).
- If `accessibility.enforceContrast` is enabled (default), `ensureContrast()` adjusts foreground pairs to meet `minimumRatio` (see [src/core/contrast.ts](../src/core/contrast.ts)).
- Persistence uses `localStorage` keyed by `storageKey` and stores `{ mode, phase }` (see [src/core/storage.ts](../src/core/storage.ts) and how it’s wired in [src/react/CircadianProvider.tsx](../src/react/CircadianProvider.tsx)).

## Tailwind integration
- Prefer mapping colors to the CSS vars (see README “CSS variables only”).
- The library also provides:
  - a preset that exposes Tailwind colors as `hsl(var(--cui-*) / <alpha-value>)` (see [src/tailwind/preset.ts](../src/tailwind/preset.ts))
  - a plugin that sets base `:root` vars + per-phase overrides using `data-cui-phase` selectors (see [src/tailwind/plugin.ts](../src/tailwind/plugin.ts))

## Workflows (repo-specific)
- Build: `npm run build` (tsup; see [tsup.config.ts](../tsup.config.ts)). Dev: `npm run dev`.
- Tests: `npm test` (Jest+jsdom; see [jest.config.cjs](../jest.config.cjs)). Tests are straightforward unit tests under [tests/](../tests/).
- Lint/typecheck: `npm run lint`, `npm run typecheck` (strict TS; see [tsconfig.json](../tsconfig.json) and [eslint.config.mjs](../eslint.config.mjs)).

## Conventions to follow
- Keep core modules pure and browser-safe where possible; guard browser-only APIs (`window`, `document`, `matchMedia`, `localStorage`) like existing code in [src/core/systemPrefs.ts](../src/core/systemPrefs.ts) and [src/core/storage.ts](../src/core/storage.ts).
- Preserve the public API surface by updating the exports in [src/index.ts](../src/index.ts) / [src/server.ts](../src/server.ts) when adding new public functions.
- When touching the phase/token pipeline, add/adjust unit tests in [tests/](../tests/) (e.g. [tests/schedule.test.ts](../tests/schedule.test.ts), [tests/contrast.test.ts](../tests/contrast.test.ts)).
