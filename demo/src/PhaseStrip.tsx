// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CSSProperties } from "react";
import { tokensToCssVars, type CircadianTokens, type Phase } from "@shiftbloom-studio/circadian-ui";
import { PHASES } from "./palette";
import { hhmm } from "./sky";

/** The same card rendered with all four token sets at once. */
export function PhaseStrip({
  tokens,
  current,
  starts,
  onPick
}: {
  tokens: Record<Phase, CircadianTokens>;
  current: Phase;
  starts: Record<Phase, number>;
  onPick: (p: Phase) => void;
}) {
  return (
    <div className="strip">
      {PHASES.map((p) => (
        <button
          key={p}
          type="button"
          className={`strip-card${p === current ? " on" : ""}`}
          style={tokensToCssVars(tokens[p]) as CSSProperties}
          onClick={() => onPick(p)}
          aria-pressed={p === current}
        >
          <span className="strip-top">
            <span className="strip-phase">{p}</span>
            <span className="strip-time">from {hhmm(starts[p])}</span>
          </span>
          <span className="strip-title">Field notes</span>
          <span className="strip-muted">Reminder: the delivery comes Thursday.</span>
          <span className="strip-row">
            <span className="strip-btn">Save</span>
            <span className="strip-chip">{p}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
