# Circadian UI

[![npm version](https://img.shields.io/npm/v/@shiftbloom-studio/circadian-ui)](https://www.npmjs.com/package/@shiftbloom-studio/circadian-ui)
[![CI](https://github.com/shiftbloom-studio/circadian-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/shiftbloom-studio/circadian-ui/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@shiftbloom-studio/circadian-ui)](LICENSE)

**Circadian UI** is a production‑ready, time‑aware theming engine for React and Tailwind. It adapts your design tokens across dawn/day/dusk/night based on local time, optional sunrise/sunset data, system preferences, and user overrides — while enforcing accessible contrast.

## What makes it special

- **Zero‑config start** — install, wrap your app, and you’re done.
- **Circadian magic** — automatic phase shifts based on time or sun data.
- **Accessible by default** — WCAG‑conscious contrast adjustments.
- **Framework‑friendly** — Next.js (App/Pages), Vite, SSR or CSR.
- **Tailwind‑native** — tokens exposed as CSS variables + preset/plugin.

---

## Install

```bash
npm install @shiftbloom-studio/circadian-ui
```

---

## 30‑second quickstart (React)

```tsx
import { CircadianProvider, CircadianScript } from "@shiftbloom-studio/circadian-ui";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CircadianScript />
      <CircadianProvider>{children}</CircadianProvider>
    </>
  );
}
```

> `CircadianScript` prevents theme flash by setting the initial phase before hydration.

---

## Next.js

### App Router

```tsx
// app/layout.tsx
import "./globals.css";
import { CircadianProvider, CircadianScript } from "@shiftbloom-studio/circadian-ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CircadianScript />
        <CircadianProvider>{children}</CircadianProvider>
      </body>
    </html>
  );
}
```

### Pages Router

```tsx
// pages/_document.tsx
import Document, { Head, Html, Main, NextScript } from "next/document";
import { CircadianScript } from "@shiftbloom-studio/circadian-ui";

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <CircadianScript />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
```

---

## Vite / CSR apps

```tsx
import { createRoot } from "react-dom/client";
import { CircadianProvider, CircadianScript } from "@shiftbloom-studio/circadian-ui";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <>
    <CircadianScript />
    <CircadianProvider>
      <App />
    </CircadianProvider>
  </>
);
```

---

## Tailwind integration

### Option A — CSS variables (recommended)

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--cui-bg) / <alpha-value>)",
        foreground: "hsl(var(--cui-fg) / <alpha-value>)",
        muted: "hsl(var(--cui-muted) / <alpha-value>)",
        "muted-foreground": "hsl(var(--cui-muted-fg) / <alpha-value>)",
        card: "hsl(var(--cui-card) / <alpha-value>)",
        "card-foreground": "hsl(var(--cui-card-fg) / <alpha-value>)",
        border: "hsl(var(--cui-border) / <alpha-value>)",
        ring: "hsl(var(--cui-ring) / <alpha-value>)",
        accent: "hsl(var(--cui-accent) / <alpha-value>)",
        "accent-foreground": "hsl(var(--cui-accent-fg) / <alpha-value>)",
        destructive: "hsl(var(--cui-destructive) / <alpha-value>)",
        "destructive-foreground": "hsl(var(--cui-destructive-fg) / <alpha-value>)"
      }
    }
  }
};

export default config;
```

### Option B — Preset + Plugin

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { circadianPlugin, circadianTailwindPreset } from "@shiftbloom-studio/circadian-ui";

const config: Config = {
  presets: [circadianTailwindPreset()],
  plugins: [plugin(circadianPlugin())]
};

export default config;
```

---

## Configuration examples

### 1) Custom schedule windows

```tsx
<CircadianProvider
  config={{
    schedule: {
      dawn: { start: "06:00", end: "09:00" },
      day: { start: "09:00", end: "18:00" },
      dusk: { start: "18:00", end: "22:00" },
      night: { start: "22:00", end: "06:00" }
    }
  }}
>
  {children}
</CircadianProvider>
```

### 2) Sun‑aware schedule

```ts
import type { SunTimesProvider } from "@shiftbloom-studio/circadian-ui";

const provider: SunTimesProvider = (date) => {
  return {
    sunrise: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 12),
    sunset: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 48)
  };
};

<CircadianProvider config={{ mode: "sun", sunTimesProvider: provider }} />;
```

### 3) Auto mode (recommended)

```tsx
<CircadianProvider config={{ mode: "auto", sunTimesProvider: provider }} />
```

If sun data is available, it uses `sun`; otherwise it falls back to `time`.

### 4) Manual override UI

```tsx
import { useCircadian } from "@shiftbloom-studio/circadian-ui";

const ModeToggle = () => {
  const { mode, resolvedMode, setMode, setPhaseOverride } = useCircadian();
  return (
    <div>
      <button onClick={() => setMode("auto")}>Auto</button>
      <button onClick={() => setPhaseOverride("night")}>Night</button>
      <p>Requested: {mode}</p>
      <p>Resolved: {resolvedMode}</p>
    </div>
  );
};
```

### 5) Initial phase hint (SSR)

```tsx
<CircadianScript config={{ initialPhase: "night" }} />
```

### 6) Disable persistence

```tsx
<CircadianProvider config={{ persist: false }} />
```

### 7) Strict contrast tuning

```tsx
<CircadianProvider
  config={{
    accessibility: {
      enforceContrast: true,
      minimumRatio: 7
    }
  }}
/>
```

---

## Design tokens

| Token                  | CSS Variable           |
| ---------------------- | ---------------------- |
| Background             | `--cui-bg`             |
| Foreground             | `--cui-fg`             |
| Muted                  | `--cui-muted`          |
| Muted Foreground       | `--cui-muted-fg`       |
| Card                   | `--cui-card`           |
| Card Foreground        | `--cui-card-fg`        |
| Border                 | `--cui-border`         |
| Ring                   | `--cui-ring`           |
| Accent                 | `--cui-accent`         |
| Accent Foreground      | `--cui-accent-fg`      |
| Destructive            | `--cui-destructive`    |
| Destructive Foreground | `--cui-destructive-fg` |

---

## API reference

### React

- `CircadianProvider`
  - Props: `{ config?: CircadianConfig; children: React.ReactNode }`
  - Applies phase + tokens to the document root (or body).
- `useCircadian()`
  - Returns `{ phase, mode, resolvedMode, setMode, setPhaseOverride, clearOverride, tokens, isAuto, nextChangeAt }`.
- `useCircadianTokens()`
  - Returns `{ tokens, cssVars, applyToStyle }` for inline usage.
- `CircadianScript`
  - Inline script component to prevent flash before hydration.

### Core utilities

- `getPhaseFromTime(date, schedule)`
- `getPhaseFromSunTimes(date, sunTimes, options)`
- `computeNextTransition(date, schedule)`
- `ensureContrast(tokens, options)`
- `resolveMode(userMode, systemPrefs, config)`
- `createInlineScript(config)`

### Tailwind

- `circadianTailwindPreset()`
- `circadianPlugin()` (wrap with `tailwindcss/plugin`)

---

## Configuration schema

```ts
interface CircadianConfig {
  schedule?: Partial<CircadianSchedule>;
  tokens?: Partial<Record<Phase, Partial<CircadianTokens>>>;
  mode?: "time" | "sun" | "manual" | "auto";
  sunTimesProvider?: SunTimesProvider;
  sunSchedule?: Partial<SunScheduleOptions>;
  initialPhase?: Phase;
  persist?: boolean;
  storageKey?: string;
  accessibility?: Partial<AccessibilityOptions>;
  system?: Partial<SystemPreferenceOptions>;
  colorSchemeBias?: Partial<ColorSchemeBias>;
  transition?: Partial<TransitionOptions>;
  setAttributeOn?: "html" | "body";
}
```

---

## Accessibility notes

Circadian UI nudges foreground tokens until they meet your configured contrast ratio. You can tune ratios for normal and large text via `accessibility.minimumRatio` and `accessibility.largeTextRatio`.

---

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```
