// SPDX-License-Identifier: AGPL-3.0-or-later
import { useMemo, useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { CircadianScheduleMinutes, Phase } from "@shiftbloom-studio/circadian-ui";
import { BAND, PHASES, SKY } from "./palette";
import { hhmm } from "./sky";

const mid = (a: number, b: number) => {
  const span = (b - a + 1440) % 1440;
  return (a + span / 2) % 1440;
};

/** Where the sun (or the moon) sits: 0..1 across the sky, 0..1 up from the horizon. */
function celestial(minutes: number, schedule: CircadianScheduleMinutes) {
  const rise = mid(schedule.dawn.start, schedule.dawn.end);
  const set = mid(schedule.dusk.start, schedule.dusk.end);
  const dayLen = (set - rise + 1440) % 1440 || 1440;
  const since = (minutes - rise + 1440) % 1440;
  if (since <= dayLen) {
    const f = since / dayLen;
    return { body: "sun" as const, x: f, y: Math.sin(Math.PI * f) };
  }
  const f = (since - dayLen) / (1440 - dayLen);
  return { body: "moon" as const, x: f, y: Math.sin(Math.PI * f) };
}

// A fixed sky: the same stars on every visit.
const STARS = Array.from({ length: 90 }, (_, i) => {
  const r = (n: number) => {
    const v = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  return { x: r(1) * 100, y: r(2) * 68, s: 0.6 + r(3) * 1.6, d: r(4) * 6 };
});

export interface SkyProps {
  minutes: number;
  phase: Phase;
  schedule: CircadianScheduleMinutes;
  onChange: (minutes: number) => void;
  onScrubStart: () => void;
}

export function SkyScene({ minutes, phase, schedule }: Pick<SkyProps, "minutes" | "phase" | "schedule">) {
  const c = celestial(minutes, schedule);
  // The path stays in the right half on wide screens so the headline stays readable.
  const left = 46 + c.x * 50;
  const bottom = c.y * 62;
  return (
    <div className="sky" aria-hidden="true">
      {PHASES.map((p) => (
        <div key={p} className="sky-layer" style={{ background: SKY[p], opacity: p === phase ? 1 : 0 }} />
      ))}
      <div className={`stars ${phase}`}>
        {STARS.map((s, i) => (
          <i key={i} style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }} />
        ))}
      </div>
      <div className={`orb ${c.body}`} style={{ left: `${left}%`, bottom: `calc(var(--horizon) + ${bottom}%)` }} />
      <div className="horizon" />
    </div>
  );
}

export function Ruler({ minutes, phase, schedule, onChange, onScrubStart }: SkyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const segments = useMemo(
    () =>
      PHASES.flatMap((p) => {
        const { start, end } = schedule[p];
        const parts = start < end ? [[start, end]] : [[start, 1440], [0, end]];
        return parts.filter(([a, b]) => b > a).map(([a, b]) => ({ p, a, b }));
      }),
    [schedule]
  );

  const fromPointer = (e: PointerEvent) => {
    const box = ref.current?.getBoundingClientRect();
    if (!box) return;
    const f = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width));
    onChange(Math.min(1435, Math.round((f * 1440) / 5) * 5));
  };
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey || e.key.startsWith("Page") ? 60 : 15;
    const keys: Record<string, number> = { ArrowRight: step, ArrowUp: step, PageUp: step, ArrowLeft: -step, ArrowDown: -step, PageDown: -step };
    if (e.key in keys) {
      e.preventDefault();
      onScrubStart();
      onChange((minutes + keys[e.key] + 1440) % 1440);
    }
  };

  return (
    <div
      className="ruler"
      ref={ref}
      onPointerDown={(e) => {
        dragging.current = true;
        e.currentTarget.setPointerCapture(e.pointerId);
        onScrubStart();
        fromPointer(e);
      }}
      onPointerMove={(e) => dragging.current && fromPointer(e)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
    >
      <div className="ruler-track">
        {segments.map(({ p, a, b }) => (
          <span
            key={`${p}-${a}`}
            className={`seg-band ${p}${p === phase ? " on" : ""}`}
            style={{ left: `${(a / 1440) * 100}%`, width: `${((b - a) / 1440) * 100}%`, background: BAND[p] }}
          >
            {b - a > 120 && <em>{p}</em>}
          </span>
        ))}
      </div>
      <div className="ruler-ticks" aria-hidden="true">
        {Array.from({ length: 25 }, (_, h) => (
          <span key={h} style={{ left: `${(h / 24) * 100}%` }} className={h % 6 === 0 ? "major" : ""}>
            {h % 3 === 0 && h < 24 ? <b>{String(h).padStart(2, "0")}</b> : null}
          </span>
        ))}
      </div>
      <div
        className="thumb"
        style={{ left: `${(minutes / 1440) * 100}%` }}
        role="slider"
        tabIndex={0}
        aria-label="Time of day"
        aria-valuemin={0}
        aria-valuemax={1439}
        aria-valuenow={minutes}
        aria-valuetext={`${hhmm(minutes)}, ${phase}`}
        onKeyDown={onKey}
      >
        <span>{hhmm(minutes)}</span>
      </div>
    </div>
  );
}
