// SPDX-License-Identifier: AGPL-3.0-or-later
import { useRef, type KeyboardEvent, type PointerEvent } from "react";
import type { CircadianScheduleMinutes, Phase } from "@shiftbloom-studio/circadian-ui";
import { ARC, PHASES } from "./palette";
import { hhmm } from "./sky";

const SIZE = 400;
const C = SIZE / 2;
const R = 158;
const WIDTH = 30;

/** 0 minutes (midnight) sits at the bottom, noon at the top, time runs clockwise. */
const angleOf = (minutes: number) => (minutes / 1440) * 360 + 180;
const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.sin(a), C - r * Math.cos(a)] as const;
};

function arcPath(start: number, end: number, r: number) {
  let span = end - start;
  if (span <= 0) span += 1440;
  if (span >= 1440) span = 1439.9;
  const a0 = angleOf(start);
  const a1 = a0 + (span / 1440) * 360;
  const [x0, y0] = point(a0, r);
  const [x1, y1] = point(a1, r);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export interface DialProps {
  minutes: number;
  phase: Phase;
  schedule: CircadianScheduleMinutes;
  nextChange: string | null;
  sunrise: number | null;
  sunset: number | null;
  onChange: (minutes: number) => void;
  onScrubStart: () => void;
}

export function Dial({ minutes, phase, schedule, nextChange, sunrise, sunset, onChange, onScrubStart }: DialProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const fromPointer = (e: PointerEvent) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box) return;
    const dx = e.clientX - (box.left + box.width / 2);
    const dy = e.clientY - (box.top + box.height / 2);
    const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const m = ((((deg - 180) % 360) + 360) % 360) * 4;
    onChange(Math.round(m / 5) * 5 % 1440);
  };

  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey || e.key === "PageUp" || e.key === "PageDown" ? 60 : 15;
    const keys: Record<string, number> = { ArrowUp: step, ArrowRight: step, PageUp: step, ArrowDown: -step, ArrowLeft: -step, PageDown: -step };
    if (e.key in keys) {
      e.preventDefault();
      onScrubStart();
      onChange((minutes + keys[e.key] + 1440) % 1440);
    } else if (e.key === "Home") {
      e.preventDefault();
      onScrubStart();
      onChange(0);
    }
  };

  const [hx, hy] = point(angleOf(minutes), R);
  const ticks = Array.from({ length: 24 }, (_, h) => {
    const [x0, y0] = point(angleOf(h * 60), R - WIDTH / 2 - 8);
    const [x1, y1] = point(angleOf(h * 60), R - WIDTH / 2 - (h % 6 === 0 ? 18 : 12));
    return <line key={h} x1={x0} y1={y0} x2={x1} y2={y1} className={h % 6 === 0 ? "tick major" : "tick"} />;
  });
  const labels = [0, 6, 12, 18].map((h) => {
    const [x, y] = point(angleOf(h * 60), R - WIDTH / 2 - 34);
    return (
      <text key={h} x={x} y={y} className="dial-hour" textAnchor="middle" dominantBaseline="central">
        {String(h).padStart(2, "0")}
      </text>
    );
  });
  const sunMark = (m: number | null, key: string) => {
    if (m === null) return null;
    const [x0, y0] = point(angleOf(m), R + WIDTH / 2 + 4);
    const [x1, y1] = point(angleOf(m), R + WIDTH / 2 + 14);
    const [tx, ty] = point(angleOf(m), R + WIDTH / 2 + 26);
    return (
      <g key={key} className="sun-mark">
        <line x1={x0} y1={y0} x2={x1} y2={y1} />
        <text x={tx} y={ty} textAnchor="middle" dominantBaseline="central">
          {key === "rise" ? "↑" : "↓"} {hhmm(m)}
        </text>
      </g>
    );
  };

  return (
    <div className="dial">
      <svg
        ref={svgRef}
        viewBox={`-30 -30 ${SIZE + 60} ${SIZE + 60}`}
        onPointerDown={(e) => {
          dragging.current = true;
          (e.target as Element).setPointerCapture?.(e.pointerId);
          onScrubStart();
          fromPointer(e);
        }}
        onPointerMove={(e) => dragging.current && fromPointer(e)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <circle cx={C} cy={C} r={R} className="dial-track" style={{ strokeWidth: WIDTH }} />
        {PHASES.map((p) => (
          <path
            key={p}
            d={arcPath(schedule[p].start, schedule[p].end, R)}
            className={`dial-arc${p === phase ? " on" : ""}`}
            style={{ stroke: ARC[p], strokeWidth: p === phase ? WIDTH : WIDTH - 12 }}
          />
        ))}
        {ticks}
        {labels}
        {sunMark(sunrise, "rise")}
        {sunMark(sunset, "set")}
        <g
          className="dial-handle"
          role="slider"
          tabIndex={0}
          aria-label="Time of day"
          aria-valuemin={0}
          aria-valuemax={1439}
          aria-valuenow={minutes}
          aria-valuetext={`${hhmm(minutes)}, ${phase}`}
          onKeyDown={onKey}
        >
          <circle cx={hx} cy={hy} r={22} className="handle-halo" />
          <circle cx={hx} cy={hy} r={13} className="handle-seed" />
        </g>
      </svg>
      <div className="dial-center" aria-live="polite">
        <span className="dial-time">{hhmm(minutes)}</span>
        <span className="dial-phase">{phase}</span>
        {nextChange && <span className="dial-next">until {nextChange}</span>}
      </div>
    </div>
  );
}
