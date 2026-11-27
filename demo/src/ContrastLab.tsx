// SPDX-License-Identifier: AGPL-3.0-or-later
import { useState } from "react";
import { contrastRatio, defaultAccessibility, ensureContrast, type CircadianTokens, type Phase } from "@shiftbloom-studio/circadian-ui";

const START: Record<Phase, number> = { dawn: 68, day: 70, dusk: 38, night: 30 };

const lightnessOf = (hsl: string) => Number(hsl.split(" ")[2].replace("%", ""));
const withLightness = (hsl: string, l: number) => {
  const [h, s] = hsl.split(" ");
  return `${h} ${s} ${l}%`;
};

function Sample({ label, bg, fg, target }: { label: string; bg: string; fg: string; target: number }) {
  const ratio = contrastRatio(fg, bg);
  const pass = ratio >= target;
  return (
    <figure className="cl-sample">
      <figcaption className="label">{label}</figcaption>
      <div className="cl-box" style={{ background: `hsl(${bg})`, color: `hsl(${fg})` }}>
        <p>Reminder: the delivery comes Thursday, not Friday.</p>
        <code>--cui-muted-fg: {fg}</code>
      </div>
      <p className={`cl-ratio ${pass ? "pass" : "fail"}`}>
        <strong>{ratio.toFixed(2)}:1</strong> <span>{pass ? `clears ${target}:1` : `below ${target}:1`}</span>
      </p>
    </figure>
  );
}

export function ContrastLab({ base, phase }: { base: CircadianTokens; phase: Phase }) {
  const [lightness, setLightness] = useState<Record<Phase, number>>(START);
  const [target, setTarget] = useState(4.5);
  const l = lightness[phase];
  const asked: CircadianTokens = { ...base, mutedFg: withLightness(base.mutedFg, l) };
  const shipped = ensureContrast(asked, { ...defaultAccessibility, minimumRatio: target });
  const moved = lightnessOf(shipped.mutedFg) - l;

  return (
    <div className="cl">
      <div className="cl-controls">
        <label className="field">
          <span className="label">muted text lightness · {phase}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={l}
            onChange={(e) => setLightness({ ...lightness, [phase]: Number(e.target.value) })}
          />
          <span className="cl-value">{l}%</span>
        </label>
        <div className="seg" role="group" aria-label="Target contrast ratio">
          {[
            { v: 3, t: "3:1 large text" },
            { v: 4.5, t: "4.5:1 AA" },
            { v: 7, t: "7:1 AAA" }
          ].map((o) => (
            <button key={o.v} type="button" aria-pressed={target === o.v} onClick={() => setTarget(o.v)}>
              {o.t}
            </button>
          ))}
        </div>
      </div>
      <div className="cl-pair">
        <Sample label="the token you wrote" bg={asked.muted} fg={asked.mutedFg} target={target} />
        <Sample label="what circadian-ui ships" bg={shipped.muted} fg={shipped.mutedFg} target={target} />
      </div>
      <p className="cl-note">
        {moved === 0
          ? "Your color already clears the target, so circadian-ui leaves it exactly as you wrote it."
          : `circadian-ui moved the lightness ${moved > 0 ? "up" : "down"} by ${Math.abs(moved)} points, in steps of 2, and kept your hue and saturation.`}
      </p>
    </div>
  );
}
