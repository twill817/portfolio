"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BRAND_STORAGE_KEY,
  DEFAULT_BRAND,
  DEFAULT_MODE,
  MODE_STORAGE_KEY,
  readStoredBrand,
  readStoredMode,
  type Brand,
  type Mode,
} from "@/lib/theme";

type ThemeContextValue = {
  brand: Brand;
  mode: Mode;
  setBrand: (brand: Brand) => void;
  setMode: (mode: Mode) => void;
  toggleMode: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The boot script already set these on <html> before hydration; this
  // state only needs to match on mount for the switcher UI, then it drives
  // the DOM attributes going forward.
  const [brand, setBrandState] = useState<Brand>(DEFAULT_BRAND);
  const [mode, setModeState] = useState<Mode>(DEFAULT_MODE);

  useEffect(() => {
    // Reconciles React state with what the pre-hydration boot script already
    // applied to <html> (from localStorage/prefers-color-scheme). Doing this
    // in an effect — rather than a lazy useState initializer — is
    // intentional: the server render always uses the defaults, so matching
    // that on the client's first pass avoids a hydration mismatch. Only the
    // switcher UI lags a tick; the DOM attributes (and colors) are already
    // correct from the boot script.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBrandState(readStoredBrand());
    setModeState(readStoredMode());
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-brand", brand);
    window.localStorage.setItem(BRAND_STORAGE_KEY, brand);
  }, [brand]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    window.localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  const setBrand = useCallback((next: Brand) => setBrandState(next), []);
  const setMode = useCallback((next: Mode) => setModeState(next), []);
  const toggleMode = useCallback(
    () => setModeState((prev) => (prev === "light" ? "dark" : "light")),
    []
  );

  const value = useMemo(
    () => ({ brand, mode, setBrand, setMode, toggleMode }),
    [brand, mode, setBrand, setMode, toggleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
