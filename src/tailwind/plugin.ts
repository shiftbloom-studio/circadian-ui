import { defaultTokens, tokensToCssVars } from "../core/tokens";

interface TailwindPluginApi {
  addBase: (styles: Record<string, Record<string, string>>) => void;
}

export const circadianPlugin = () => {
  return ({ addBase }: TailwindPluginApi) => {
    addBase({
      ":root": tokensToCssVars(defaultTokens.day),
      "[data-cui-phase='dawn']": tokensToCssVars(defaultTokens.dawn),
      "[data-cui-phase='day']": tokensToCssVars(defaultTokens.day),
      "[data-cui-phase='dusk']": tokensToCssVars(defaultTokens.dusk),
      "[data-cui-phase='night']": tokensToCssVars(defaultTokens.night)
    });
  };
};
