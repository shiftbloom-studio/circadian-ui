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
  type CircadianConfig,
  type SunTimes
} from "@shiftbloom-studio/circadian-ui";
import pkg from "../../package.json";
import { bloomSvg } from "./bloom";
import { ContrastLab } from "./ContrastLab";
import { Dial } from "./Dial";
import { LiveReadout } from "./LiveReadout";
import { shiftbloomTokens } from "./palette";
import { CITIES, DAYS, hhmm, minutesIn, minutesOf, sunriseSunset } from "./sky";
import { Stage } from "./Stage";

type Source = "clock" | "sun";
type Palette = "shiftbloom" | "defaults";

const INSTALL = "npm install @shiftbloom-studio/circadian-ui";
const REPO = "https://github.com/shiftbloom-studio/circadian-ui";
const NPM = "https://www.npmjs.com/package/@shiftbloom-studio/circadian-ui";
const liveConfig: CircadianConfig = { persist: false, tokens: shiftbloomTokens };

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
  const [palette, setPalette] = useState<Palette>("shiftbloom");
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
    const overrides = palette === "shiftbloom" ? shiftbloomTokens : undefined;
    const base = resolveTokens(phase, overrides);
    const tokens = ensureContrast(base, defaultAccessibility);
    return { phase, schedule, next: hhmm(minutesOf(next)), base, tokens, useSun };
  }, [year, day, minutes, source, sun, palette]);

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

  const polar =
    source === "sun" && sun.kind !== "normal"
      ? `The sun ${sun.kind === "polar-night" ? "doesn't rise" : "doesn't set"} in ${city.name} on ${day.label}. The provider returns null, so circadian-ui falls back to the clock schedule. That's what you see on the dial.`
      : null;

  return (
    <>
      <header className="top wrap">
        <a className="brand" href="/" aria-label="circadian-ui demo">
          <span dangerouslySetInnerHTML={{ __html: bloomSvg({ size: 30, id: "hd" }) }} />
          <span className="word">
            circadian-ui<i>.</i>
          </span>
        </a>
        <nav className="nav">
          <span className="label ver">v{pkg.version}</span>
          <a href={REPO}>GitHub</a>
          <a href={NPM}>npm</a>
        </nav>
      </header>

      <main>
        <section className="hero wrap">
          <div className="hero-copy">
            <span className="label red">open source library for react</span>
            <h1>
              Your app at 6 a.m. shouldn't look like your app at midnight<em>.</em>
            </h1>
            <p className="lede">
              circadian-ui moves a React app through four token sets as the day goes on, following the visitor's clock or
              the real sunrise where they are. Before a color reaches the page, it checks every text pair against WCAG and
              fixes the ones that fail. Drag the red seed around the dial and watch the panel next to it.
            </p>
            <div className="install">
              <code>{INSTALL}</code>
              <CopyButton text={INSTALL} />
            </div>
          </div>
        </section>

        <section className="lab wrap" aria-labelledby="lab-h">
          <h2 id="lab-h" className="sr">Day simulator</h2>
          <div className="lab-grid">
            <div className="lab-left">
              <Dial
                minutes={minutes}
                phase={sim.phase}
                schedule={sim.schedule}
                nextChange={sim.next}
                sunrise={sim.useSun ? sun.rise : null}
                sunset={sim.useSun ? sun.set : null}
                onChange={setMinutes}
                onScrubStart={stop}
              />
              <div className="lab-buttons">
                <button type="button" className="btn" onClick={play} aria-pressed={playing}>
                  {playing ? "Pause" : "Play a day in 24 seconds"}
                </button>
                <button type="button" className="btn ghost" onClick={toNow}>
                  Back to now
                </button>
              </div>
              <div className="controls">
                <div className="seg" role="group" aria-label="What decides the phase">
                  <button type="button" aria-pressed={source === "clock"} onClick={() => setSource("clock")}>
                    Clock schedule
                  </button>
                  <button type="button" aria-pressed={source === "sun"} onClick={() => setSource("sun")}>
                    Real sunrise
                  </button>
                </div>
                {source === "sun" && (
                  <div className="row">
                    <label className="field">
                      <span className="label">city</span>
                      <select value={cityId} onChange={(e) => setCityId(e.target.value)}>
                        {CITIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span className="label">date</span>
                      <select value={dayId} onChange={(e) => setDayId(e.target.value)}>
                        {DAYS.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                <p className="hint">
                  {source === "clock"
                    ? "Fixed windows: dawn 05:30, day 08:30, dusk 17:30, night 21:30. Those are the defaults, and every one of them can be changed."
                    : polar ??
                      `In ${city.name} on ${day.label} the sun rises at ${hhmm(sun.rise ?? 0)} and sets at ${hhmm(sun.set ?? 0)}. Dawn and dusk run 45 minutes either side.`}
                </p>
                <div className="seg small" role="group" aria-label="Token set">
                  <button type="button" aria-pressed={palette === "shiftbloom"} onClick={() => setPalette("shiftbloom")}>
                    shiftbloom tokens
                  </button>
                  <button type="button" aria-pressed={palette === "defaults"} onClick={() => setPalette("defaults")}>
                    library defaults
                  </button>
                </div>
              </div>
            </div>
            <div className="lab-right">
              <Stage tokens={sim.tokens} phase={sim.phase} />
              <p className="caption">
                This panel is an ordinary React tree. It never asks what time it is. It only reads --cui-bg, --cui-fg and ten
                other variables, and the dial decides what they hold.
              </p>
            </div>
          </div>
        </section>

        <section className="band wrap" aria-labelledby="contrast-h">
          <div className="band-head">
            <span className="label red">contrast guard</span>
            <h2 id="contrast-h">Pick a bad color on purpose</h2>
            <p>
              Drag the slider until the reminder text is hard to read. The left box shows the token as you wrote it. The
              right one is what circadian-ui puts on the page: it walks the lightness in 2% steps until the pair clears
              your target, and gives up after 24 tries rather than loop forever.
            </p>
          </div>
          <ContrastLab base={sim.base} phase={sim.phase} />
        </section>

        <section className="band wrap" aria-labelledby="live-h">
          <div className="band-head">
            <span className="label red">running on your device</span>
            <h2 id="live-h">This part isn't a simulation</h2>
            <p>
              Below is a real CircadianProvider with persist set to false, so it stores nothing. It reads your clock and
              your system's contrast setting, the same way it would in your app.
            </p>
          </div>
          <CircadianProvider config={liveConfig}>
            <LiveReadout
              onPreview={() => {
                setSource("clock");
                toNow();
                document.getElementById("lab-h")?.parentElement?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth" });
              }}
            />
          </CircadianProvider>
        </section>

        <section className="band wrap" aria-labelledby="code-h">
          <div className="band-head">
            <span className="label red">setup</span>
            <h2 id="code-h">Wrap your app once</h2>
            <p>
              CircadianScript sets the phase before React hydrates, so nobody opening your site at 23:00 gets a flash of the
              daytime theme first. Tailwind users get a preset and a plugin; everyone else reads the 12 CSS variables.
            </p>
          </div>
          <div className="code">
            <div className="code-bar">
              <span className="label">app/layout.tsx</span>
              <CopyButton text={SNIPPET} />
            </div>
            <pre>
              <code>{SNIPPET}</code>
            </pre>
          </div>
          <p className="more">
            Custom schedules, sunrise providers, manual overrides and the full API are in the{" "}
            <a href={`${REPO}#readme`}>README on GitHub</a>.
          </p>
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
