import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";

export type SettingsState = {
  audio: {
    inputId: string | null;
    outputId: string | null;
  };
  tts: {
    voiceURI: string | null;
    rate: number;
    pitch: number;
    volume: number;
    autoSpeak: boolean;
    method: 'elevenlabs' | 'native' | 'disabled';
    elevenlabsApiKey: string | null;
  };
};

const defaultState: SettingsState = {
  audio: { inputId: null, outputId: null },
  tts: { voiceURI: null, rate: 1, pitch: 1, volume: 1, autoSpeak: true, method: 'native', elevenlabsApiKey: null },
};

type Action = { type: "SET"; payload: Partial<SettingsState> };

const SettingsContext = createContext<{
  state: SettingsState;
  set: (patch: Partial<SettingsState>) => void;
} | null>(null);

function reducer(state: SettingsState, action: Action): SettingsState {
  switch (action.type) {
    case "SET":
      return { ...state, ...action.payload, audio: { ...state.audio, ...(action.payload.audio || {}) }, tts: { ...state.tts, ...(action.payload.tts || {}) } };
    default:
      return state;
  }
}

const STORAGE_KEY = "translator_settings_v1";

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, defaultState, (init) => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? { ...init, ...JSON.parse(raw) } : init;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const value = useMemo(() => ({
    state,
    set: (patch: Partial<SettingsState>) => dispatch({ type: "SET", payload: patch }),
  }), [state]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}
