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
  SunTimes,
  SystemPreferences
} from "../core/types";
import { computeNextTransition, getPhaseFromTime } from "../core/schedule";
import { computeNextSunTransition, getPhaseFromSunTimes } from "../core/sun";
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
  resolvedMode: ScheduleMode;
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
  phaseOverride: Phase | null,
  sunTimes: SunTimes | null
): Phase => {
  if (mode === "manual" && phaseOverride) {
    return phaseOverride;
  }
  if (mode === "sun" && sunTimes) {
    return getPhaseFromSunTimes(date, sunTimes, config.sunSchedule);
  }
  return getPhaseFromTime(date, config.schedule);
};

const computeNextChange = (
  date: Date,
  mode: ScheduleMode,
  config: CircadianConfig,
  sunTimes: SunTimes | null
): Date | null => {
  if (mode === "manual") {
    return null;
  }
  if (mode === "sun" && sunTimes) {
    return computeNextSunTransition(date, sunTimes, config.sunSchedule);
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
    initialPersisted?.mode ?? config.mode ?? "auto"
  );
  const [phaseOverride, setPhaseOverrideState] = useState<Phase | null>(
    initialPersisted?.phase ?? null
  );

  const [phase, setPhase] = useState<Phase>(() =>
    config.initialPhase ?? computePhase(new Date(), mode, config, phaseOverride, null)
  );

  const [nextChangeAt, setNextChangeAt] = useState<Date | null>(() =>
    computeNextChange(new Date(), mode, config, null)
  );
  const [resolvedMode, setResolvedMode] = useState<ScheduleMode>(mode);

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

  const resolveModeWithSun = useCallback(
    (date: Date): { resolvedMode: ScheduleMode; sunTimes: SunTimes | null } => {
      const desiredMode = resolveMode(mode, systemPrefs, config);
      if (desiredMode === "auto") {
        if (config.sunTimesProvider) {
          const sunTimes = config.sunTimesProvider(date);
          if (sunTimes) {
            return { resolvedMode: "sun", sunTimes };
          }
        }
        return { resolvedMode: "time", sunTimes: null };
      }
      if (desiredMode === "sun") {
        const sunTimes = config.sunTimesProvider?.(date) ?? null;
        if (!sunTimes) {
          return { resolvedMode: "time", sunTimes: null };
        }
        return { resolvedMode: "sun", sunTimes };
      }
      return { resolvedMode: desiredMode, sunTimes: null };
    },
    [mode, systemPrefs, config]
  );

  const updatePhase = useCallback(() => {
    const now = new Date();
    const { resolvedMode, sunTimes } = resolveModeWithSun(now);
    const nextPhase = computePhase(now, resolvedMode, config, phaseOverride, sunTimes);
    setResolvedMode(resolvedMode);
    setPhase(nextPhase);
    setNextChangeAt(computeNextChange(now, resolvedMode, config, sunTimes));
  }, [config, phaseOverride, resolveModeWithSun]);

  useEffect(() => {
    updatePhase();
  }, [updatePhase]);

  useEffect(() => {
    if (resolvedMode === "manual") {
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
  }, [resolvedMode, nextChangeAt, updatePhase]);

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
    setModeState(config.mode ?? "auto");
  }, [config.mode]);

  const contextValue = useMemo<CircadianContextValue>(
    () => ({
      phase,
      mode,
      tokens,
      nextChangeAt,
      setMode,
      setPhaseOverride,
      clearOverride,
      isAuto: mode !== "manual",
      resolvedMode
    }),
    [phase, mode, tokens, nextChangeAt, setMode, setPhaseOverride, clearOverride, resolvedMode]
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
