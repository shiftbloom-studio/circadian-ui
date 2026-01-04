import { useMemo } from "react";
import { useCircadianContext } from "./CircadianProvider";
import { tokensToCssVars } from "../core/tokens";

export const useCircadian = () => useCircadianContext();

export const useCircadianTokens = () => {
  const { tokens } = useCircadianContext();
  const cssVars = useMemo(() => tokensToCssVars(tokens), [tokens]);
  const applyToStyle = useMemo(
    () => ({
      style: Object.fromEntries(
        Object.entries(cssVars).map(([key, value]) => [key, value])
      )
    }),
    [cssVars]
  );

  return { tokens, cssVars, applyToStyle };
};
