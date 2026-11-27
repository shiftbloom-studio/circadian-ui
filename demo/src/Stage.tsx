// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CSSProperties } from "react";
import { cssVarMap, tokensToCssVars, type CircadianTokens, type Phase } from "@shiftbloom-studio/circadian-ui";

const NOTES: Record<Phase, { title: string; body: string; time: string }> = {
  dawn: {
    title: "Before anyone else is up",
    body: "The bakery on the corner had its lights on at 5:40 again. Two trays of rye in the window and nobody to buy them yet.",
    time: "06:12"
  },
  day: {
    title: "Lunch on the stairs",
    body: "Checked the spring invoice twice. It's off by forty euros, so somebody counted the same box of jars two times.",
    time: "12:48"
  },
  dusk: {
    title: "Watering after work",
    body: "The basil is finally taller than the pot. Left the hose coiled by the gate so it's ready for tomorrow.",
    time: "19:35"
  },
  night: {
    title: "Can't sleep, writing instead",
    body: "Still thinking about the kitchen shelf. If the bracket goes on the left, the radio fits under the window.",
    time: "01:20"
  }
};

export function Stage({ tokens, phase }: { tokens: CircadianTokens; phase: Phase }) {
  const style = tokensToCssVars(tokens) as CSSProperties;
  const note = NOTES[phase];
  return (
    <div className="stage" style={style} data-phase={phase}>
      <div className="st-bar">
        <span className="st-app">Field notes</span>
        <span className="st-badge">{phase}</span>
      </div>
      <div className="st-body">
        <aside className="st-side" aria-hidden="true">
          <span className="st-side-item on">Today</span>
          <span className="st-side-item">Garden</span>
          <span className="st-side-item">Orders</span>
          <span className="st-side-item">Archive</span>
        </aside>
        <article className="st-card">
          <span className="st-meta">
            {note.time} · 3 min read
          </span>
          <h3 className="st-title">{note.title}</h3>
          <p className="st-text">{note.body}</p>
          <div className="st-muted">Reminder: the delivery comes Thursday, not Friday.</div>
          <div className="st-tagrow">
            <span className="st-input" aria-hidden="true">
              Add a tag
            </span>
          </div>
          <div className="st-actions">
            <span className="st-btn primary">Save note</span>
            <span className="st-btn">Share</span>
            <span className="st-btn danger">Delete</span>
          </div>
        </article>
      </div>
      <ul className="st-tokens" aria-label="Current token values">
        {(Object.keys(cssVarMap) as (keyof CircadianTokens)[]).map((k) => (
          <li key={k}>
            <span className="sw" style={{ background: `hsl(${tokens[k]})` }} />
            <span className="tk">{cssVarMap[k]}</span>
            <span className="tv">{tokens[k]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
