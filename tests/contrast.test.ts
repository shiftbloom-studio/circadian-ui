import { contrastRatio, ensureContrast } from "../src/core/contrast";

const baseTokens = {
  bg: "0 0% 100%",
  fg: "0 0% 90%",
  muted: "0 0% 96%",
  mutedFg: "0 0% 86%",
  card: "0 0% 100%",
  cardFg: "0 0% 92%",
  border: "0 0% 80%",
  ring: "0 0% 40%",
  accent: "0 0% 96%",
  accentFg: "0 0% 85%",
  destructive: "0 70% 50%",
  destructiveFg: "0 0% 100%"
};

describe("ensureContrast", () => {
  it("raises contrast for foreground pairs", () => {
    const adjusted = ensureContrast(baseTokens, {
      minimumRatio: 4.5,
      preferPreserveHue: true,
      maxIterations: 40
    });

    expect(contrastRatio(adjusted.fg, adjusted.bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(adjusted.cardFg, adjusted.card)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(adjusted.mutedFg, adjusted.muted)).toBeGreaterThanOrEqual(4.5);
  });
});
