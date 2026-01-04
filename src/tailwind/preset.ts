import { cssVarMap } from "../core/tokens";

const toColor = (cssVar: string) => `hsl(var(${cssVar}) / <alpha-value>)`;

export const circadianTailwindPreset = () => {
  return {
    theme: {
      extend: {
        colors: {
          background: toColor(cssVarMap.bg),
          foreground: toColor(cssVarMap.fg),
          muted: toColor(cssVarMap.muted),
          "muted-foreground": toColor(cssVarMap.mutedFg),
          card: toColor(cssVarMap.card),
          "card-foreground": toColor(cssVarMap.cardFg),
          border: toColor(cssVarMap.border),
          ring: toColor(cssVarMap.ring),
          accent: toColor(cssVarMap.accent),
          "accent-foreground": toColor(cssVarMap.accentFg),
          destructive: toColor(cssVarMap.destructive),
          "destructive-foreground": toColor(cssVarMap.destructiveFg)
        }
      }
    }
  };
};
