import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { getMinutesFromDate, minutesInDay, normalizeSchedule } from "../core/schedule";
import { defaultTokens } from "../core/tokens";
import type { CircadianSchedule, Phase } from "../core/types";
import { useCircadian } from "./hooks";

export interface CircadianTimeTravelProps {
  schedule?: Partial<CircadianSchedule>;
  onClose?: () => void;
}

export interface PhaseBand {
  phase: Phase;
  start: number;
  end: number;
}

const PLAY_DURATION_MS = 20000;
const PLAY_STEP_MS = 100;
const PHASES: Phase[] = ["dawn", "day", "dusk", "night"];

export const formatMinutes = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
};

export const dateAtMinutes = (minutes: number, base: Date = new Date()): Date => {
  const date = new Date(base);
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return date;
};

export const getPhaseBands = (schedule?: Partial<CircadianSchedule>): PhaseBand[] => {
  const windows = normalizeSchedule(schedule);
  const bands: PhaseBand[] = [];
  for (const phase of PHASES) {
    const window = windows[phase];
    if (window.start < window.end) {
      bands.push({ phase, start: window.start, end: window.end });
    } else if (window.start > window.end) {
      bands.push({ phase, start: window.start, end: minutesInDay });
      bands.push({ phase, start: 0, end: window.end });
    }
  }
  return bands.sort((a, b) => a.start - b.start);
};

export const CircadianTimeTravel = ({ schedule, onClose }: CircadianTimeTravelProps) => {
  const { phase, resolvedMode, timeOverride, setTimeOverride, tokens } = useCircadian();
  const [playing, setPlaying] = useState(false);
  const playStartRef = useRef<number | null>(null);

  const minutes = timeOverride ? getMinutesFromDate(timeOverride) : getMinutesFromDate(new Date());
  const bands = getPhaseBands(schedule);
  const windows = normalizeSchedule(schedule);
  const showBands = resolvedMode === "time";

  // Clearing the override when the panel closes or unmounts returns the app
  // to real time without a reload.
  useEffect(() => {
    return () => {
      setTimeOverride(null);
    };
  }, [setTimeOverride]);

  // Play runs through a full day in about 20 seconds, from midnight.
  useEffect(() => {
    if (!playing) {
      return;
    }
    playStartRef.current = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - (playStartRef.current ?? Date.now());
      const next = (elapsed / PLAY_DURATION_MS) * minutesInDay;
      if (next >= minutesInDay) {
        window.clearInterval(interval);
        setPlaying(false);
        setTimeOverride(dateAtMinutes(minutesInDay - 1));
        return;
      }
      setTimeOverride(dateAtMinutes(Math.floor(next)));
    }, PLAY_STEP_MS);
    return () => window.clearInterval(interval);
  }, [playing, setTimeOverride]);

  const handleSliderChange = (value: number) => {
    setPlaying(false);
    setTimeOverride(dateAtMinutes(value));
  };

  const handlePlay = () => {
    setPlaying(!playing);
  };

  const handleClose = () => {
    setPlaying(false);
    setTimeOverride(null);
    onClose?.();
  };

  const panelStyle: CSSProperties = {
    position: "fixed",
    right: 16,
    bottom: 16,
    zIndex: 9999,
    width: 280,
    padding: 16,
    borderRadius: 12,
    background: `hsl(${tokens.card})`,
    color: `hsl(${tokens.cardFg})`,
    border: `1px solid hsl(${tokens.border})`,
    boxShadow: "0 8px 30px rgba(0, 0, 0, 0.25)",
    fontFamily: "inherit"
  };

  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between"
  };

  const stripStyle: CSSProperties = {
    display: "flex",
    height: 8,
    overflow: "hidden",
    borderRadius: 4
  };

  const noteStyle: CSSProperties = { fontSize: 12 };

  return (
    <section aria-label="Time travel" style={panelStyle}>
      <div style={headerStyle}>
        <strong>Time travel</strong>
        <button type="button" onClick={handleClose}>
          Back to real time
        </button>
      </div>
      <p>
        {formatMinutes(minutes)} - {phase}
        {timeOverride ? " (preview)" : " (now)"}
      </p>
      <input
        type="range"
        aria-label="Time of day"
        min={0}
        max={minutesInDay - 1}
        step={1}
        value={minutes}
        onChange={(event) => handleSliderChange(Number(event.target.value))}
        onPointerDown={() => setPlaying(false)}
        style={{ width: "100%" }}
      />
      {showBands ? (
        <>
          <div aria-hidden="true" style={stripStyle}>
            {bands.map((band) => (
              <span
                key={`${band.phase}-${band.start}`}
                style={{
                  width: `${((band.end - band.start) / minutesInDay) * 100}%`,
                  background: `hsl(${defaultTokens[band.phase].accent})`,
                  flexShrink: 0
                }}
              />
            ))}
          </div>
          <p style={noteStyle}>
            {PHASES.map((name) => (
              <span key={name} style={{ marginRight: 8 }}>
                {name} {formatMinutes(windows[name].start)}-{formatMinutes(windows[name].end)}
              </span>
            ))}
          </p>
        </>
      ) : (
        <p style={noteStyle}>
          Phase windows follow the time schedule, so they are hidden in {resolvedMode} mode.
        </p>
      )}
      <button type="button" onClick={handlePlay}>
        {playing ? "Pause" : "Play a day"}
      </button>
    </section>
  );
};
