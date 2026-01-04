import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import {
  CircadianConfig,
  CircadianState,
  Phase,
  ScheduleMode,
  SystemPreferences
} from "../core/types";
import { getPhaseFromTime, computeNextTransition } from "../core/schedule";
import { getPhaseFromSunTimes, getScheduleFromProvider } from "../core/sun";
import { applyColorSchemeBias, applyTokensToElement, resolveTokens } from "../core/tokens";
import { ensureContrast } from "../core/contrast";
import { loadPersistedState, persistState } from "../core/storage";
import { getSystemPreferences, subscribeSystemPreferences } from "../core/systemPrefs";
import {
  defaultColorSchemeBias,
  defaultSystemOptions,
  defaultTransition,
  resolveAccessibility,
  resolveMode
} from "../core/resolve";

export interface CircadianContextValue extends CircadianState {
  setMode: (mode: ScheduleMode) => void;
  setPhaseOverride: (phase: Phase) => void;
  clearOverride: () => void;
  isAuto: boolean;
}

const CircadianContext = createContext<CircadianContextValue | null>(null);

const getRootElement = (target: CircadianConfig["setAttributeOn"]): HTMLElement => {
  if (typeof document === "undefined") {
    return {} as HTMLElement;
  }
  return target === "body" ? document.body : document.documentElement;
};

const getInitialSystemPreferences = (): SystemPreferences => {
  if (typeof window === "undefined") {
    return {
      prefersColorScheme: "no-preference",
      prefersContrast: "no-preference",
      reducedMotion: false
    };
  }
  return getSystemPreferences();
};

const computePhase = (
  date: Date,
  mode: ScheduleMode,
  config: CircadianConfig,
  phaseOverride: Phase | null
): Phase => {
  if (mode === "manual" && phaseOverride) {
    return phaseOverride;
  }
  if (mode === "sun") {
    const sunTimes = config.sunTimesProvider?.(date);
    if (sunTimes) {
      return getPhaseFromSunTimes(date, sunTimes, config.sunSchedule);
    }
  }
  return getPhaseFromTime(date, config.schedule);
};

const computeNextChange = (
  date: Date,
  mode: ScheduleMode,
  config: CircadianConfig
): Date | null => {
  if (mode === "manual") {
    return null;
  }
  if (mode === "sun") {
    const schedule = getScheduleFromProvider(date, config.sunTimesProvider, config.sunSchedule);
    if (schedule) {
      return computeNextTransition(date, schedule);
    }
  }
  return computeNextTransition(date, config.schedule);
};

export interface CircadianProviderProps {
  config?: CircadianConfig;
  children: ReactNode;
}

export const CircadianProvider = ({ config = {}, children }: CircadianProviderProps) => {
  const storageKey = config.storageKey;
  const shouldPersist = config.persist !== false;
  const [systemPrefs, setSystemPrefs] = useState<SystemPreferences>(getInitialSystemPreferences);

  const initialPersisted =
    typeof window !== "undefined" && shouldPersist ? loadPersistedState(storageKey) : null;

  const [mode, setModeState] = useState<ScheduleMode>(
    initialPersisted?.mode ?? config.mode ?? "time"
  );
  const [phaseOverride, setPhaseOverrideState] = useState<Phase | null>(
    initialPersisted?.phase ?? null
  );

  const [phase, setPhase] = useState<Phase>(() =>
    computePhase(new Date(), mode, config, phaseOverride)
  );

  const [nextChangeAt, setNextChangeAt] = useState<Date | null>(() =>
    computeNextChange(new Date(), mode, config)
  );

  const timerRef = useRef<number | null>(null);

  const accessibility = useMemo(
    () => resolveAccessibility(systemPrefs, config),
    [systemPrefs, config]
  );

  const transition = { ...defaultTransition, ...config.transition };
  const systemOptions = { ...defaultSystemOptions, ...config.system };
  const colorBias = { ...defaultColorSchemeBias, ...config.colorSchemeBias };

  const tokens = useMemo(() => {
    let resolved = resolveTokens(phase, config.tokens);
    if (systemOptions.respectColorScheme) {
      resolved = applyColorSchemeBias(resolved, systemPrefs.prefersColorScheme, colorBias);
    }
    if (accessibility.enforceContrast) {
      resolved = ensureContrast(resolved, accessibility);
    }
    return resolved;
  }, [
    phase,
    config.tokens,
    systemPrefs.prefersColorScheme,
    accessibility,
    systemOptions.respectColorScheme,
    colorBias
  ]);

  const updatePhase = useCallback(() => {
    const now = new Date();
    const resolvedMode = resolveMode(mode, systemPrefs, config);
    const nextPhase = computePhase(now, resolvedMode, config, phaseOverride);
    setPhase(nextPhase);
    setNextChangeAt(computeNextChange(now, resolvedMode, config));
  }, [mode, systemPrefs, config, phaseOverride]);

  useEffect(() => {
    updatePhase();
  }, [updatePhase]);

  useEffect(() => {
    if (mode === "manual") {
      return;
    }
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    if (!nextChangeAt) {
      return;
    }
    const delay = Math.max(0, nextChangeAt.getTime() - Date.now() + 500);
    timerRef.current = window.setTimeout(() => {
      updatePhase();
    }, delay);
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [mode, nextChangeAt, updatePhase]);

  useEffect(() => {
    const root = getRootElement(config.setAttributeOn);
    if (!root || !root.style) {
      return;
    }
    root.setAttribute("data-cui-phase", phase);
    const allowMotion = !systemPrefs.reducedMotion || !systemOptions.respectReducedMotion;
    if (transition.enabled && allowMotion) {
      root.style.transition = `background-color ${transition.durationMs}ms ease, color ${transition.durationMs}ms ease`;
    } else {
      root.style.transition = "";
    }
    applyTokensToElement(root, tokens);
  }, [
    phase,
    tokens,
    transition,
    systemPrefs.reducedMotion,
    systemOptions.respectReducedMotion,
    config.setAttributeOn
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    return subscribeSystemPreferences(setSystemPrefs);
  }, []);

  useEffect(() => {
    if (!shouldPersist) {
      return;
    }
    persistState(
      {
        mode,
        phase: phaseOverride
      },
      storageKey
    );
  }, [mode, phaseOverride, shouldPersist, storageKey]);

  const setMode = useCallback(
    (nextMode: ScheduleMode) => {
      setModeState(nextMode);
      if (nextMode === "manual" && !phaseOverride) {
        setPhaseOverrideState(phase);
      }
    },
    [phase, phaseOverride]
  );

  const setPhaseOverride = useCallback((nextPhase: Phase) => {
    setPhaseOverrideState(nextPhase);
    setModeState("manual");
  }, []);

  const clearOverride = useCallback(() => {
    setPhaseOverrideState(null);
    setModeState("time");
  }, []);

  const contextValue = useMemo<CircadianContextValue>(
    () => ({
      phase,
      mode,
      tokens,
      nextChangeAt,
      setMode,
      setPhaseOverride,
      clearOverride,
      isAuto: mode !== "manual"
    }),
    [phase, mode, tokens, nextChangeAt, setMode, setPhaseOverride, clearOverride]
  );

  return <CircadianContext.Provider value={contextValue}>{children}</CircadianContext.Provider>;
};

export const useCircadianContext = () => {
  const context = useContext(CircadianContext);
  if (!context) {
    throw new Error("useCircadian must be used within a CircadianProvider");
  }
  return context;
};
