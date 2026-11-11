"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type LanguageMode = "english" | "urdu" | "both";

interface LanguageContextType {
  mode: LanguageMode;
  setMode: (mode: LanguageMode) => void;
  /**
   * Helper function to format labels according to active language mode.
   * - english: returns english string
   * - urdu: returns urdu string (or english fallback if urdu missing)
   * - both: returns "English (Urdu)"
   */
  t: (english: string, urdu?: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  mode: "english",
  setMode: () => {},
  t: (english) => english,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<LanguageMode>("english");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("paperless_ui_language_mode") as LanguageMode | null;
      if (saved && ["english", "urdu", "both"].includes(saved)) {
        setModeState(saved);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setMode = (newMode: LanguageMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("paperless_ui_language_mode", newMode);
    } catch {
      // Ignore
    }
  };

  const t = (english: string, urdu?: string): string => {
    if (!urdu) return english;
    if (mode === "english") return english;
    if (mode === "urdu") return urdu;
    return `${english} (${urdu})`;
  };

  return (
    <LanguageContext.Provider value={{ mode, setMode, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
