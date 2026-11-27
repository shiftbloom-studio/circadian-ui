// SPDX-License-Identifier: AGPL-3.0-or-later
import type { CircadianTokens, Phase } from "@shiftbloom-studio/circadian-ui";

/**
 * The demo's own token set, passed to circadian-ui as `config.tokens` exactly as you would pass yours:
 * apricot mornings, clear blue days, violet evenings and a deep navy night.
 */
export const circadianTokens: Record<Phase, CircadianTokens> = {
  dawn: {
    bg: "28 80% 95%",
    fg: "260 30% 14%",
    muted: "28 62% 89%",
    mutedFg: "260 15% 30%",
    card: "30 100% 98%",
    cardFg: "260 30% 14%",
    border: "25 40% 82%",
    ring: "14 85% 50%",
    accent: "14 100% 90%",
    accentFg: "14 80% 30%",
    destructive: "354 75% 46%",
    destructiveFg: "0 0% 100%"
  },
  day: {
    bg: "200 40% 97%",
    fg: "222 40% 12%",
    muted: "205 38% 92%",
    mutedFg: "215 20% 30%",
    card: "0 0% 100%",
    cardFg: "222 40% 12%",
    border: "205 25% 85%",
    ring: "212 90% 46%",
    accent: "205 100% 92%",
    accentFg: "212 80% 30%",
    destructive: "354 75% 46%",
    destructiveFg: "0 0% 100%"
  },
  dusk: {
    bg: "268 40% 15%",
    fg: "30 90% 94%",
    muted: "268 32% 21%",
    mutedFg: "280 25% 80%",
    card: "268 36% 19%",
    cardFg: "30 90% 94%",
    border: "268 25% 32%",
    ring: "24 95% 62%",
    accent: "300 40% 30%",
    accentFg: "320 90% 87%",
    destructive: "354 85% 64%",
    destructiveFg: "268 40% 10%"
  },
  night: {
    bg: "228 45% 7%",
    fg: "215 40% 93%",
    muted: "228 35% 12%",
    mutedFg: "215 20% 74%",
    card: "228 38% 10%",
    cardFg: "215 40% 93%",
    border: "228 25% 20%",
    ring: "200 90% 65%",
    accent: "222 45% 20%",
    accentFg: "200 90% 85%",
    destructive: "354 80% 62%",
    destructiveFg: "228 45% 7%"
  }
};

export const PHASES: Phase[] = ["dawn", "day", "dusk", "night"];

/** Sky behind the hero. Scenery, not tokens: the page text on top of it still comes from the tokens. */
export const SKY: Record<Phase, string> = {
  dawn: "linear-gradient(180deg, #ffd3bd 0%, #ffbfc9 48%, #fde9db 100%)",
  day: "linear-gradient(180deg, #a9d8ff 0%, #dcefff 52%, #f4faff 100%)",
  dusk: "linear-gradient(180deg, #23143f 0%, #5a2468 46%, #c2506a 78%, #f08a55 100%)",
  night: "linear-gradient(180deg, #03061a 0%, #0a1433 62%, #16224a 100%)"
};

/** Ruler band colors. */
export const BAND: Record<Phase, string> = {
  dawn: "#ff9e7a",
  day: "#7cc4ff",
  dusk: "#a33a8c",
  night: "#18224d"
};
