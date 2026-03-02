"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CHIME_BASE_HZ, CHIME_SEPARATION_HZ, clampBaseFrequency } from "@/lib/dsp/protocol";
import { ModemConfig, ModemContextValue } from "@/types/modem";

const DEFAULT_MODEM_CONFIG: ModemConfig = {
  baudRateMs: 80,
  baseFrequencyHz: CHIME_BASE_HZ,
  separationHz: CHIME_SEPARATION_HZ,
  amplitude: 0.4,
  stealthMode: false,
  protocolMode: "enhanced",
};

const ModemContext = createContext<ModemContextValue | null>(null);

type ModemProviderProps = {
  children: React.ReactNode;
};

export function ModemProvider({ children }: ModemProviderProps): React.JSX.Element {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [modemConfig, setConfig] = useState(DEFAULT_MODEM_CONFIG);

  const setModemConfig = useCallback((next: Partial<ModemConfig>): void => {
    setConfig((prev) => {
      const merged = { ...prev, ...next };
      merged.baseFrequencyHz = clampBaseFrequency(merged.baseFrequencyHz, merged.stealthMode);
      return merged;
    });
  }, []);

  const ensureReady = useCallback(async (): Promise<AudioContext> => {
    const context: AudioContext = audioContext ?? new AudioContext();
    if (audioContext === null) {
      setAudioContext(context);
    }

    if (context.state === "suspended") {
      await context.resume();
    }

    return context;
  }, [audioContext]);

  useEffect(() => {
    return () => {
      if (audioContext !== null && audioContext.state !== "closed") {
        void audioContext.close();
      }
    };
  }, [audioContext]);

  const value = useMemo<ModemContextValue>(
    () => ({
      audioContext,
      modemConfig,
      setModemConfig,
      ensureReady,
    }),
    [audioContext, modemConfig, setModemConfig, ensureReady],
  );

  return <ModemContext.Provider value={value}>{children}</ModemContext.Provider>;
}

export function useAudioModem(): ModemContextValue {
  const value: ModemContextValue | null = useContext(ModemContext);
  if (value === null) {
    throw new Error("useAudioModem must be used within ModemProvider.");
  }
  return value;
}
