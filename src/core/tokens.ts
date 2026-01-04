import {
  CircadianTokens,
  ColorSchemeBias,
  Phase
} from "./types";

export const defaultTokens: Record<Phase, CircadianTokens> = {
  dawn: {
    bg: "27 60% 96%",
    fg: "24 18% 18%",
    muted: "27 40% 90%",
    mutedFg: "24 14% 35%",
    card: "0 0% 100%",
    cardFg: "24 18% 18%",
    border: "24 22% 84%",
    ring: "20 65% 45%",
    accent: "20 80% 92%",
    accentFg: "20 40% 30%",
    destructive: "0 74% 55%",
    destructiveFg: "0 0% 100%"
  },
  day: {
    bg: "0 0% 100%",
    fg: "222 28% 14%",
    muted: "210 20% 96%",
    mutedFg: "215 16% 35%",
    card: "0 0% 100%",
    cardFg: "222 28% 14%",
    border: "214 20% 90%",
    ring: "220 65% 45%",
    accent: "220 90% 95%",
    accentFg: "220 45% 30%",
    destructive: "0 72% 55%",
    destructiveFg: "0 0% 100%"
  },
  dusk: {
    bg: "240 24% 14%",
    fg: "30 40% 95%",
    muted: "245 20% 22%",
    mutedFg: "30 20% 80%",
    card: "240 22% 16%",
    cardFg: "30 40% 95%",
    border: "245 16% 30%",
    ring: "32 70% 60%",
    accent: "32 55% 25%",
    accentFg: "32 70% 85%",
    destructive: "0 70% 55%",
    destructiveFg: "0 0% 100%"
  },
  night: {
    bg: "230 22% 10%",
    fg: "210 40% 96%",
    muted: "230 18% 16%",
    mutedFg: "210 20% 80%",
    card: "230 20% 12%",
    cardFg: "210 40% 96%",
    border: "230 16% 24%",
    ring: "210 80% 60%",
    accent: "210 35% 20%",
    accentFg: "210 50% 90%",
    destructive: "0 65% 55%",
    destructiveFg: "0 0% 100%"
  }
};

export const cssVarMap: Record<keyof CircadianTokens, string> = {
  bg: "--cui-bg",
  fg: "--cui-fg",
  muted: "--cui-muted",
  mutedFg: "--cui-muted-fg",
  card: "--cui-card",
  cardFg: "--cui-card-fg",
  border: "--cui-border",
  ring: "--cui-ring",
  accent: "--cui-accent",
  accentFg: "--cui-accent-fg",
  destructive: "--cui-destructive",
  destructiveFg: "--cui-destructive-fg"
};

export const resolveTokens = (
  phase: Phase,
  overrides?: Partial<Record<Phase, Partial<CircadianTokens>>>
): CircadianTokens => {
  return {
    ...defaultTokens[phase],
    ...overrides?.[phase]
  };
};

export const tokensToCssVars = (
  tokens: CircadianTokens
): Record<string, string> => {
  const vars: Record<string, string> = {};
  for (const [key, value] of Object.entries(tokens)) {
    const cssVar = cssVarMap[key as keyof CircadianTokens];
    vars[cssVar] = value;
  }
  return vars;
};

export const applyTokensToElement = (
  element: HTMLElement,
  tokens: CircadianTokens
) => {
  const vars = tokensToCssVars(tokens);
  for (const [key, value] of Object.entries(vars)) {
    element.style.setProperty(key, value);
  }
};

export const applyColorSchemeBias = (
  tokens: CircadianTokens,
  prefers: "dark" | "light" | "no-preference",
  bias: ColorSchemeBias
): CircadianTokens => {
  if (prefers === "no-preference") {
    return tokens;
  }
  const delta = prefers === "dark" ? bias.dark : bias.light;
  const adjust = (value: string): string => {
    const [h, s, l] = value.split(" ");
    const lightness = Math.max(
      0,
      Math.min(100, Number(l.replace("%", "")) + delta)
    );
    return `${h} ${s} ${lightness}%`;
  };

  return {
    ...tokens,
    bg: adjust(tokens.bg),
    fg: adjust(tokens.fg),
    muted: adjust(tokens.muted),
    mutedFg: adjust(tokens.mutedFg),
    card: adjust(tokens.card),
    cardFg: adjust(tokens.cardFg),
    border: adjust(tokens.border),
    ring: adjust(tokens.ring),
    accent: adjust(tokens.accent),
    accentFg: adjust(tokens.accentFg),
    destructive: adjust(tokens.destructive),
    destructiveFg: adjust(tokens.destructiveFg)
  };
};
