export const BRANDS = ["minimal", "editorial", "studio"] as const;
export type Brand = (typeof BRANDS)[number];

export const MODES = ["light", "dark"] as const;
export type Mode = (typeof MODES)[number];

export const DEFAULT_BRAND: Brand = "editorial";
export const DEFAULT_MODE: Mode = "light";

export const BRAND_LABELS: Record<Brand, string> = {
  minimal: "Minimal",
  editorial: "Editorial",
  studio: "Studio",
};

export const BRAND_STORAGE_KEY = "portfolio-brand";
export const MODE_STORAGE_KEY = "portfolio-mode";

function isBrand(value: unknown): value is Brand {
  return typeof value === "string" && (BRANDS as readonly string[]).includes(value);
}

function isMode(value: unknown): value is Mode {
  return typeof value === "string" && (MODES as readonly string[]).includes(value);
}

/**
 * Sets data-brand/data-theme on <html> before hydration so there's no
 * flash of the wrong theme. Runs as an inline, blocking script — must stay
 * dependency-free and tolerate storage/matchMedia being unavailable.
 */
export function themeBootScript(): string {
  return `(function() {
    try {
      var brands = ${JSON.stringify(BRANDS)};
      var modes = ${JSON.stringify(MODES)};
      var storedBrand = localStorage.getItem(${JSON.stringify(BRAND_STORAGE_KEY)});
      var storedMode = localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});
      var brand = brands.indexOf(storedBrand) !== -1 ? storedBrand : ${JSON.stringify(DEFAULT_BRAND)};
      var mode = modes.indexOf(storedMode) !== -1
        ? storedMode
        : (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : ${JSON.stringify(DEFAULT_MODE)});
      var root = document.documentElement;
      root.setAttribute('data-brand', brand);
      root.setAttribute('data-theme', mode);
    } catch (e) {}
  })();`;
}

export function readStoredBrand(): Brand {
  if (typeof window === "undefined") return DEFAULT_BRAND;
  const stored = window.localStorage.getItem(BRAND_STORAGE_KEY);
  return isBrand(stored) ? stored : DEFAULT_BRAND;
}

export function readStoredMode(): Mode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  if (isMode(stored)) return stored;
  if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return DEFAULT_MODE;
}
