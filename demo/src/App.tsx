// SPDX-License-Identifier: AGPL-3.0-or-later
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CircadianProvider,
  computeNextSunTransition,
  computeNextTransition,
  defaultAccessibility,
  deriveSunSchedule,
  ensureContrast,
  getPhaseFromSunTimes,
  getPhaseFromTime,
  normalizeSchedule,
  resolveTokens,
  applyTokensToElement,
  type CircadianConfig,
  type CircadianTokens,
  type Phase,
  type SunTimes
} from "@shiftbloom-studio/circadian-ui";
import pkg from "../../package.json";
import { ContrastLab } from "./ContrastLab";
import { LiveReadout } from "./LiveReadout";
import { circadianTokens, PHASES } from "./palette";
import { PhaseStrip } from "./PhaseStrip";
import { CITIES, DAYS, hhmm, minutesIn, minutesOf, sunriseSunset } from "./sky";
import { Ruler, SkyScene } from "./Sky";
import { Stage } from "./Stage";

type Source = "clock" | "sun";
type Palette = "circadian" | "defaults";

const INSTALL = "npm install @shiftbloom-studio/circadian-ui";
const REPO = "https://github.com/shiftbloom-studio/circadian-ui";
const NPM = "https://www.npmjs.com/package/@shiftbloom-studio/circadian-ui";
const liveConfig: CircadianConfig = { persist: false, tokens: circadianTokens };

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="copy"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setDone(true);
            window.setTimeout(() => setDone(false), 1600);
          })
          .catch(() => setDone(false));
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}

export function App() {
  const year = new Date().getFullYear();
  const [source, setSource] = useState<Source>("clock");
  const [cityId, setCityId] = useState("berlin");
  const [dayId, setDayId] = useState("jun");
  const [palette, setPalette] = useState<Palette>("circadian");
  const [minutes, setMinutes] = useState(() => minutesOf(new Date()));
  const [playing, setPlaying] = useState(false);
  const raf = useRef<number | null>(null);

  const city = CITIES.find((c) => c.id === cityId) ?? CITIES[0];
  const day = DAYS.find((d) => d.id === dayId) ?? DAYS[1];

  // Sunrise and sunset in the city's own clock time, handed to circadian-ui as a SunTimesProvider would.
  const sun = useMemo(() => {
    const r = sunriseSunset(year, day.month, day.day, city.lat, city.lon);
    if (r.kind !== "normal") return { kind: r.kind, times: null as SunTimes | null, rise: null, set: null };
    const rise = minutesIn(city.tz, r.sunriseUtc);
    const set = minutesIn(city.tz, r.sunsetUtc);
    const at = (m: number) => new Date(year, day.month, day.day, Math.floor(m / 60), m % 60);
    return { kind: r.kind, times: { sunrise: at(rise), sunset: at(set) } as SunTimes | null, rise, set };
  }, [year, day, city]);

  const sim = useMemo(() => {
    const date = new Date(year, day.month, day.day, Math.floor(minutes / 60), minutes % 60);
    const useSun = source === "sun" && sun.times !== null;
    const phase = useSun ? getPhaseFromSunTimes(date, sun.times!) : getPhaseFromTime(date);
    const schedule = useSun ? deriveSunSchedule(date, sun.times!) : normalizeSchedule();
    const next = useSun ? computeNextSunTransition(date, sun.times!) : computeNextTransition(date);
    const overrides = palette === "circadian" ? circadianTokens : undefined;
    const all = Object.fromEntries(
      PHASES.map((p) => [p, ensureContrast(resolveTokens(p, overrides), defaultAccessibility)])
    ) as Record<Phase, CircadianTokens>;
    const base = resolveTokens(phase, overrides);
    return { phase, schedule, next: hhmm(minutesOf(next)), base, tokens: all[phase], all, useSun };
  }, [year, day, minutes, source, sun, palette]);

  // The whole page follows the simulated clock: the tokens go on <body>, and everything reads them.
  useEffect(() => {
    applyTokensToElement(document.body, sim.tokens);
    document.body.dataset.phase = sim.phase;
    document.documentElement.style.background = `hsl(${sim.tokens.bg})`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", `hsl(${sim.tokens.bg})`);
  }, [sim.tokens, sim.phase]);

  const stop = useCallback(() => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setPlaying(false);
  }, []);

  const play = () => {
    if (playing) return stop();
    setPlaying(true);
    const from = minutes;
    const t0 = performance.now();
    const stepped = reducedMotion();
    const tick = (t: number) => {
      const elapsed = (t - t0) / 1000; // 24 seconds for the whole day
      if (elapsed >= 24) {
        setMinutes(from);
        stop();
        return;
      }
      const m = from + elapsed * 60;
      setMinutes(Math.floor((stepped ? Math.floor(m / 60) * 60 : m) % 1440));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };
  useEffect(() => stop, [stop]);

  const toNow = () => {
    stop();
    setMinutes(source === "sun" ? minutesIn(city.tz, new Date()) : minutesOf(new Date()));
  };

  const pick = (p: Phase) => {
    stop();
    const { start, end } = sim.schedule[p];
    const span = (end - start + 1440) % 1440;
    setMinutes(Math.round((start + span / 2) % 1440));
  };

  const polar =
    source === "sun" && sun.kind !== "normal"
      ? `The sun ${sun.kind === "polar-night" ? "doesn't rise" : "doesn't set"} in ${city.name} on ${day.label}. The sunrise provider returns null, so circadian-ui falls back to the clock schedule.`
      : null;
  const starts = Object.fromEntries(PHASES.map((p) => [p, sim.schedule[p].start])) as Record<Phase, number>;

  return (
    <>
      <section className={`hero ${sim.phase}`} aria-labelledby="hero-h">
        <SkyScene minutes={minutes} phase={sim.phase} schedule={sim.schedule} />
        <header className="top">
          <a className="brand" href="/" aria-label="circadian-ui demo">
            <span className="brand-dot" aria-hidden="true" />
            <span className="word">circadian</span>
          </a>
          <nav className="nav">
            <span className="mono ver">v{pkg.version}</span>
            <a href={REPO}>GitHub</a>
            <a href={NPM}>npm</a>
          </nav>
        </header>

        <div className="hero-body">
          <div className="hero-copy">
            <span className="mono kicker">a react library · this whole page is the demo</span>
            <h1 id="hero-h">Your app at 6 a.m. shouldn't look like your app at midnight.</h1>
            <p className="lede">
              circadian-ui moves an interface through dawn, day, dusk and night tokens as the hours pass, using the
              visitor's clock or the real sunrise where they are, and fixes any text color that drops below WCAG on the way.
              Drag the timeline at the bottom. Everything on this page, down to the footer, is reading the same 12 CSS
              variables.
            </p>
            <div className="install">
              <code>{INSTALL}</code>
              <CopyButton text={INSTALL} />
            </div>
          </div>
          <div className="clock" aria-live="polite">
            <span className="clock-time">{hhmm(minutes)}</span>
            <span className="clock-phase">
              {sim.phase} <small>until {sim.next}</small>
            </span>
          </div>
        </div>

        <div className="dock">
          <div className="dock-bar">
            <button type="button" className="btn" onClick={play} aria-pressed={playing}>
              {playing ? "Pause" : "Play a day in 24 s"}
            </button>
            <button type="button" className="btn ghost" onClick={toNow}>
              Now
            </button>
            <span className="dock-sep" aria-hidden="true" />
            <div className="seg" role="group" aria-label="What decides the phase">
              <button type="button" aria-pressed={source === "clock"} onClick={() => setSource("clock")}>
                Clock
              </button>
              <button type="button" aria-pressed={source === "sun"} onClick={() => setSource("sun")}>
                Sunrise
              </button>
            </div>
            {source === "sun" && (
              <>
                <select aria-label="City" value={cityId} onChange={(e) => setCityId(e.target.value)}>
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select aria-label="Date" value={dayId} onChange={(e) => setDayId(e.target.value)}>
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </>
            )}
            <span className="dock-sep" aria-hidden="true" />
            <div className="seg" role="group" aria-label="Token set">
              <button type="button" aria-pressed={palette === "circadian"} onClick={() => setPalette("circadian")}>
                Custom tokens
              </button>
              <button type="button" aria-pressed={palette === "defaults"} onClick={() => setPalette("defaults")}>
                Defaults
              </button>
            </div>
          </div>
          <p className="dock-hint">
            {source === "clock"
              ? "Clock schedule: dawn 05:30, day 08:30, dusk 17:30, night 21:30. Those are the defaults, and you can move every one."
              : polar ??
                `${city.name}, ${day.label}: sunrise ${hhmm(sun.rise ?? 0)}, sunset ${hhmm(sun.set ?? 0)}. Dawn and dusk run 45 minutes either side.`}
          </p>
          <Ruler minutes={minutes} phase={sim.phase} schedule={sim.schedule} onChange={setMinutes} onScrubStart={stop} />
        </div>
      </section>

      <main>
        <section className="band" aria-labelledby="app-h">
          <div className="band-grid">
            <div className="band-head">
              <span className="mono kicker">one component tree</span>
              <h2 id="app-h">The app never asks what time it is</h2>
              <p>
                This notes app is plain React and CSS. It reads --cui-bg, --cui-fg and ten other variables, and that's all
                it knows. circadian-ui decides what they hold. Its 12 current values are listed under the card, and they
                change as you drag.
              </p>
            </div>
            <Stage tokens={sim.tokens} phase={sim.phase} />
          </div>
          <PhaseStrip tokens={sim.all} current={sim.phase} starts={starts} onPick={pick} />
        </section>

        <section className="band" aria-labelledby="contrast-h">
          <div className="band-head wide">
            <span className="mono kicker">contrast guard</span>
            <h2 id="contrast-h">Pick a bad color on purpose</h2>
            <p>
              Drag the slider until the reminder is hard to read. The left box shows the token as you wrote it. The right
              one is what circadian-ui puts on the page: it walks the lightness in 2% steps until the pair clears your
              target, and stops after 24 tries.
            </p>
          </div>
          <ContrastLab base={sim.base} phase={sim.phase} />
        </section>

        <section className="band" aria-labelledby="live-h">
          <div className="band-head wide">
            <span className="mono kicker">running on your device</span>
            <h2 id="live-h">This part isn't simulated</h2>
            <p>
              A real CircadianProvider, with persist set to false so it stores nothing. It reads your clock and your
              system's contrast setting, exactly as it would inside your app.
            </p>
          </div>
          <CircadianProvider config={liveConfig}>
            <LiveReadout
              onPreview={() => {
                setSource("clock");
                toNow();
                window.scrollTo({ top: 0, behavior: reducedMotion() ? "auto" : "smooth" });
              }}
            />
          </CircadianProvider>
        </section>

        <section className="band" aria-labelledby="code-h">
          <div className="band-grid code-grid">
            <div className="band-head">
              <span className="mono kicker">setup</span>
              <h2 id="code-h">Wrap your app once</h2>
              <p>
                CircadianScript sets the phase before React hydrates, so nobody opening your site at 23:00 gets a flash of
                the daytime theme first. Tailwind users get a preset and a plugin; everyone else reads the 12 CSS variables.
              </p>
              <p>
                Custom schedules, sunrise providers, manual overrides and the full API are in the{" "}
                <a href={`${REPO}#readme`}>README</a>.
              </p>
            </div>
            <div className="code">
              <div className="code-bar">
                <span className="mono">app/layout.tsx</span>
                <CopyButton text={SNIPPET} />
              </div>
              <pre>
                <code>{SNIPPET}</code>
              </pre>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

const SNIPPET = `import { CircadianProvider, CircadianScript } from "@shiftbloom-studio/circadian-ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CircadianScript />
        <CircadianProvider config={{ mode: "auto" }}>{children}</CircadianProvider>
      </body>
    </html>
  );
}

/* globals.css */
body {
  background: hsl(var(--cui-bg));
  color: hsl(var(--cui-fg));
}`;
