import { CircadianTokens } from "./types";

export interface ContrastOptions {
  minimumRatio: number;
  preferPreserveHue: boolean;
  maxIterations: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

const parseHsl = (value: string): [number, number, number] => {
  const [h, s, l] = value.split(" ");
  return [Number(h), Number(s.replace("%", "")) / 100, Number(l.replace("%", "")) / 100];
};

const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return [r + m, g + m, b + m];
};

const relativeLuminance = (hsl: string): number => {
  const [h, s, l] = parseHsl(hsl);
  const [r, g, b] = hslToRgb(h, s, l).map((channel) => {
    const linear = channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
    return linear;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrastRatio = (foreground: string, background: string): number => {
  const lum1 = relativeLuminance(foreground);
  const lum2 = relativeLuminance(background);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
};

const adjustLightness = (value: string, delta: number): string => {
  const [h, s, l] = value.split(" ");
  const lightness = clamp(Number(l.replace("%", "")) + delta);
  return `${h} ${s} ${lightness}%`;
};

const ensurePairContrast = (
  background: string,
  foreground: string,
  options: ContrastOptions
): string => {
  let current = foreground;
  if (contrastRatio(current, background) >= options.minimumRatio) {
    return current;
  }

  const foregroundLum = relativeLuminance(foreground);
  const backgroundLum = relativeLuminance(background);
  const moveDarker = foregroundLum < backgroundLum;
  const step = moveDarker ? -2 : 2;

  for (let i = 0; i < options.maxIterations; i += 1) {
    current = adjustLightness(current, step);
    if (contrastRatio(current, background) >= options.minimumRatio) {
      return current;
    }
  }

  return current;
};

export const ensureContrast = (
  tokens: CircadianTokens,
  options: ContrastOptions
): CircadianTokens => {
  return {
    ...tokens,
    fg: ensurePairContrast(tokens.bg, tokens.fg, options),
    mutedFg: ensurePairContrast(tokens.muted, tokens.mutedFg, options),
    cardFg: ensurePairContrast(tokens.card, tokens.cardFg, options),
    accentFg: ensurePairContrast(tokens.accent, tokens.accentFg, options),
    destructiveFg: ensurePairContrast(tokens.destructive, tokens.destructiveFg, options)
  };
};
