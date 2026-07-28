"use client";

import { BRANDS, BRAND_LABELS } from "@/lib/theme";
import { useTheme } from "./ThemeProvider";

export function ThemeSwitcher() {
  const { brand, mode, setBrand, toggleMode } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <div
        role="group"
        aria-label="Brand style"
        className="flex items-center gap-1 rounded-token border border-border p-1"
      >
        {BRANDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={brand === option}
            onClick={() => setBrand(option)}
            className={`rounded-token px-2.5 py-1 text-xs font-medium transition-colors ${
              brand === option
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {BRAND_LABELS[option]}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={toggleMode}
        aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
        aria-pressed={mode === "dark"}
        className="flex h-8 w-8 items-center justify-center rounded-token border border-border text-foreground transition-colors hover:bg-surface"
      >
        {mode === "light" ? <MoonIcon /> : <SunIcon />}
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
      />
    </svg>
  );
}
