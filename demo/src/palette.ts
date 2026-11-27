// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CircadianTokens, Phase } from "@shiftbloom-studio/circadian-ui";

/**
 * The shiftbloom token set: the paper, ink and reds of the studio's brand book, stretched over four
 * phases. Passed to circadian-ui as `config.tokens`, exactly as you would pass your own.
 */
export const shiftbloomTokens: Record<Phase, CircadianTokens> = {
  dawn: {
    bg: "350 60% 96%",
    fg: "330 18% 9%",
    muted: "350 42% 91%",
    mutedFg: "330 10% 33%",
    card: "24 38% 98%",
    cardFg: "330 18% 9%",
    border: "350 30% 85%",
    ring: "344 85% 42%",
    accent: "344 100% 92%",
    accentFg: "344 85% 32%",
    destructive: "350 80% 42%",
    destructiveFg: "0 0% 100%"
  },
  day: {
    bg: "23 31% 95%",
    fg: "330 18% 9%",
    muted: "20 26% 91%",
    mutedFg: "330 8% 35%",
    card: "24 38% 97%",
    cardFg: "330 18% 9%",
    border: "354 16% 87%",
    ring: "344 85% 42%",
    accent: "344 100% 95%",
    accentFg: "344 85% 36%",
    destructive: "344 85% 42%",
    destructiveFg: "0 0% 100%"
  },
  dusk: {
    bg: "335 32% 15%",
    fg: "20 60% 94%",
    muted: "335 26% 21%",
    mutedFg: "345 30% 80%",
    card: "335 30% 19%",
    cardFg: "20 60% 94%",
    border: "335 20% 30%",
    ring: "350 100% 66%",
    accent: "345 55% 29%",
    accentFg: "345 100% 87%",
    destructive: "350 85% 60%",
    destructiveFg: "330 18% 9%"
  },
  night: {
    bg: "330 18% 7%",
    fg: "340 25% 92%",
    muted: "330 14% 12%",
    mutedFg: "340 12% 72%",
    card: "330 16% 10%",
    cardFg: "340 25% 92%",
    border: "330 12% 21%",
    ring: "350 100% 62%",
    accent: "345 40% 18%",
    accentFg: "345 100% 85%",
    destructive: "350 80% 58%",
    destructiveFg: "330 18% 7%"
  }
};

export const PHASES: Phase[] = ["dawn", "day", "dusk", "night"];

/** Colors of the four arcs on the dial (page chrome, not tokens). */
export const ARC: Record<Phase, string> = {
  dawn: "#FF8FAB",
  day: "#FFDCE7",
  dusk: "#C81040",
  night: "#1A1216"
};
