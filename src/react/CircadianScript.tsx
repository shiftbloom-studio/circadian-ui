import React, { useMemo } from "react";
import { CircadianConfig } from "../core/types";
import { createInlineScript } from "../core/script";

export interface CircadianScriptProps {
  config?: CircadianConfig;
  nonce?: string;
}

export const CircadianScript = ({ config, nonce }: CircadianScriptProps) => {
  const script = useMemo(() => createInlineScript(config), [config]);
  return (
    <script
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
};
