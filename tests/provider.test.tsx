import React, { useEffect } from "react";
import { render, waitFor } from "@testing-library/react";
import { CircadianProvider, useCircadian } from "../src/react";

const TestComponent = () => {
  const { setPhaseOverride } = useCircadian();

  useEffect(() => {
    setPhaseOverride("dusk");
  }, [setPhaseOverride]);

  return null;
};

describe("CircadianProvider", () => {
  it("sets data attribute on document element", async () => {
    render(
      <CircadianProvider>
        <TestComponent />
      </CircadianProvider>
    );

    await waitFor(() => {
      expect(document.documentElement.getAttribute("data-cui-phase")).toBe(
        "dusk"
      );
    });
  });
});
