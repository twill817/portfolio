import type { Preview } from "@storybook/nextjs-vite";
import React, { useEffect } from "react";
import { Inter, Fraunces, Bricolage_Grotesque } from "next/font/google";
import { BRANDS, BRAND_LABELS, MODES } from "../src/lib/theme";
import "../src/app/globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });
const fontVariables = `${inter.variable} ${fraunces.variable} ${bricolage.variable}`;

/**
 * globals.css scopes every token to `:root[data-brand][data-theme]` — the
 * attributes must live on the real <html> element, not a wrapper div, so
 * this decorator mutates document.documentElement directly (mirroring what
 * ThemeProvider does in the app) rather than wrapping story output.
 */
function WithThemeAttributes(Story: React.ComponentType, context: { globals: { brand?: string; theme?: string } }) {
  const brand = context.globals.brand ?? "editorial";
  const theme = context.globals.theme ?? "light";

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add(...fontVariables.split(" ").filter(Boolean));
    root.setAttribute("data-brand", brand);
    root.setAttribute("data-theme", theme);
  }, [brand, theme]);

  return <Story />;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: "todo",
    },
    backgrounds: { disable: true }, // background color comes from the active brand/theme token, not the addon
  },
  globalTypes: {
    brand: {
      description: "Brand mode",
      toolbar: {
        title: "Brand",
        icon: "paintbrush",
        items: BRANDS.map((b) => ({ value: b, title: BRAND_LABELS[b] })),
        dynamicTitle: true,
      },
    },
    theme: {
      description: "Light / dark mode",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: MODES.map((m) => ({ value: m, title: m === "light" ? "Light" : "Dark" })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    brand: "editorial",
    theme: "light",
  },
  decorators: [WithThemeAttributes],
};

export default preview;
