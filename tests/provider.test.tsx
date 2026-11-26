import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { CircadianProvider } from "../src/react/CircadianProvider";
import type { CircadianContextValue } from "../src/react/CircadianProvider";
import { useCircadian } from "../src/react/hooks";
import { getPhaseFromTime } from "../src/core/schedule";

const Probe = ({ onContext }: { onContext: (value: CircadianContextValue) => void }) => {
  const value = useCircadian();
  onContext(value);
  return null;
};

describe("provider time override", () => {
  let container: HTMLDivElement;
  let root: Root;
  let seen: CircadianContextValue | null = null;

  const atMinutes = (minutes: number): Date => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setMinutes(minutes);
    return date;
  };

  beforeEach(() => {
    // jsdom has no matchMedia; the provider reads the system preferences on mount.
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false
      })
    });
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    seen = null;
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("follows the overridden time instead of the real time", async () => {
    const realPhase = getPhaseFromTime(new Date());
    await act(async () => {
      root.render(
        <CircadianProvider config={{ mode: "time", persist: false }}>
          <Probe onContext={(value) => { seen = value; }} />
        </CircadianProvider>
      );
    });
    expect(seen?.phase).toBe(realPhase);
    await act(async () => {
      seen?.setTimeOverride(atMinutes(180));
    });
    expect(seen?.phase).toBe("night");
    expect(seen?.timeOverride?.getHours()).toBe(3);
    expect(seen?.timeOverride?.getMinutes()).toBe(0);
    await act(async () => {
      seen?.setTimeOverride(atMinutes(720));
    });
    expect(seen?.phase).toBe("day");
    await act(async () => {
      seen?.setTimeOverride(null);
    });
    expect(seen?.phase).toBe(realPhase);
    expect(seen?.timeOverride).toBeNull();
  });

  it("clears the time override with clearOverride", async () => {
    const realPhase = getPhaseFromTime(new Date());
    await act(async () => {
      root.render(
        <CircadianProvider config={{ mode: "time", persist: false }}>
          <Probe onContext={(value) => { seen = value; }} />
        </CircadianProvider>
      );
    });
    await act(async () => {
      seen?.setTimeOverride(atMinutes(180));
    });
    expect(seen?.phase).toBe("night");
    await act(async () => {
      seen?.clearOverride();
    });
    expect(seen?.timeOverride).toBeNull();
    expect(seen?.phase).toBe(realPhase);
  });

  it("follows the overridden time in sun mode", async () => {
    await act(async () => {
      root.render(
        <CircadianProvider
          config={{
            mode: "sun",
            persist: false,
            sunTimesProvider: () => ({ sunrise: atMinutes(360), sunset: atMinutes(1080) })
          }}
        >
          <Probe onContext={(value) => { seen = value; }} />
        </CircadianProvider>
      );
    });
    expect(seen?.resolvedMode).toBe("sun");
    await act(async () => {
      seen?.setTimeOverride(atMinutes(720));
    });
    expect(seen?.phase).toBe("day");
    await act(async () => {
      seen?.setTimeOverride(atMinutes(180));
    });
    expect(seen?.phase).toBe("night");
  });
});
