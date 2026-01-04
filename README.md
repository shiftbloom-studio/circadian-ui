# Circadian UI

[![npm version](https://img.shields.io/npm/v/circadian-ui)](https://www.npmjs.com/package/circadian-ui)
[![CI](https://github.com/circadian-ui/circadian-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/circadian-ui/circadian-ui/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/circadian-ui)](LICENSE)

Automatic, accessible, Tailwind-friendly time-of-day theming for React and Next.js. Circadian UI adapts your design tokens based on local time, optional sunrise/sunset data, system preferences, and user overrides — all while keeping contrast WCAG-conscious.

## Why this matters

- **Readable at any hour**: avoid low-contrast screens at night or overly-bright palettes at dawn.
- **Reduced eye strain**: thoughtful shifts in luminance and contrast help users stay comfortable.
- **Consistent branding**: keep your token system intact while letting Circadian UI handle timing and accessibility.

## Install

```bash
npm install circadian-ui
```

## Quickstart (React)

```tsx
import { CircadianProvider, CircadianScript } from "circadian-ui";

export function App({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CircadianScript />
      <CircadianProvider>{children}</CircadianProvider>
    </>
  );
}
```

## Next.js (App Router)

```tsx
// app/layout.tsx
import "./globals.css";
import { CircadianProvider, CircadianScript } from "circadian-ui";

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

## Next.js (Pages Router)

```tsx
// pages/_document.tsx
import Document, { Head, Html, Main, NextScript } from "next/document";
import { CircadianScript } from "circadian-ui";

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

## Tailwind setup

### CSS variables only (recommended)

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

### Tailwind preset + plugin

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { circadianPlugin, circadianTailwindPreset } from "circadian-ui";

const config: Config = {
  presets: [circadianTailwindPreset()],
  plugins: [plugin(circadianPlugin())]
};

export default config;
```

## Configuration examples

### Custom time windows

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

### Manual override UI

```tsx
import { useCircadian } from "circadian-ui";

const ModeToggle = () => {
  const { mode, setMode, setPhaseOverride } = useCircadian();
  return (
    <div>
      <button onClick={() => setMode("time")}>Auto</button>
      <button onClick={() => setPhaseOverride("night")}>Night</button>
      <span>Current mode: {mode}</span>
    </div>
  );
};
```

### Sun-times provider

```ts
import type { SunTimesProvider } from "circadian-ui";

const provider: SunTimesProvider = (date) => {
  // Plug in your own sunrise/sunset provider
  return {
    sunrise: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 12),
    sunset: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 19, 48)
  };
};

<CircadianProvider config={{ mode: "sun", sunTimesProvider: provider }} />;
```

### Disable persistence

```tsx
<CircadianProvider config={{ persist: false }} />
```

### Strict contrast mode

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

## Accessibility notes

Circadian UI enforces WCAG-conscious contrast by default. Foreground tokens are nudged in lightness until they meet the configured ratio. You can tune ratios for normal and large text via `accessibility.minimumRatio` and `accessibility.largeTextRatio`.

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

## API reference

### React

- `CircadianProvider`
  - Props: `{ config?: CircadianConfig; children: React.ReactNode }`
  - Sets `data-cui-phase` and CSS vars on the document root.
- `useCircadian()`
  - Returns `{ phase, mode, setMode, setPhaseOverride, clearOverride, tokens, isAuto, nextChangeAt }`.
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

## Configuration schema

```ts
interface CircadianConfig {
  schedule?: Partial<CircadianSchedule>;
  tokens?: Partial<Record<Phase, Partial<CircadianTokens>>>;
  mode?: "time" | "sun" | "manual";
  sunTimesProvider?: SunTimesProvider;
  sunSchedule?: Partial<SunScheduleOptions>;
  persist?: boolean;
  storageKey?: string;
  accessibility?: Partial<AccessibilityOptions>;
  system?: Partial<SystemPreferenceOptions>;
  colorSchemeBias?: Partial<ColorSchemeBias>;
  transition?: Partial<TransitionOptions>;
  setAttributeOn?: "html" | "body";
}
```

## Development

```bash
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
```
