// SPDX-License-Identifier: AGPL-3.0-or-later
import { useEffect, useState } from "react";
import { getSystemPreferences, resolveAccessibility, subscribeSystemPreferences, useCircadian, type SystemPreferences } from "@shiftbloom-studio/circadian-ui";
import { hhmm, minutesOf } from "./sky";

/** Runs inside a real CircadianProvider. Nothing here is simulated. */
export function LiveReadout({ onPreview }: { onPreview: () => void }) {
  const { phase, resolvedMode, nextChangeAt, tokens } = useCircadian();
  const [prefs, setPrefs] = useState<SystemPreferences>(getSystemPreferences);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => subscribeSystemPreferences(setPrefs), []);
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), 15000);
    return () => window.clearInterval(t);
  }, []);
  const ratio = resolveAccessibility(prefs).minimumRatio;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="live">
      <dl className="live-grid">
        <div>
          <dt className="label">your clock</dt>
          <dd>{hhmm(minutesOf(now))}</dd>
          <dd className="small">{tz}</dd>
        </div>
        <div>
          <dt className="label">phase</dt>
          <dd>{phase}</dd>
          <dd className="small">{nextChangeAt ? `until ${hhmm(minutesOf(nextChangeAt))}` : "held manually"}</dd>
        </div>
        <div>
          <dt className="label">resolved mode</dt>
          <dd>{resolvedMode}</dd>
          <dd className="small">no sunrise lookup set, so the clock decides</dd>
        </div>
        <div>
          <dt className="label">contrast target</dt>
          <dd>{ratio}:1</dd>
          <dd className="small">
            {prefs.prefersContrast === "more"
              ? "raised because you asked your system for more contrast"
              : prefs.prefersContrast === "less"
                ? "lowered because your system asks for less contrast"
                : "your system has no contrast preference"}
          </dd>
        </div>
      </dl>
      <div className="live-swatches" aria-hidden="true">
        {(["bg", "card", "muted", "accent", "fg", "ring"] as const).map((k) => (
          <span key={k} style={{ background: `hsl(${tokens[k]})` }} title={k} />
        ))}
      </div>
      <button type="button" className="btn ghost" onClick={onPreview}>
        Show my time on the dial
      </button>
    </div>
  );
}
