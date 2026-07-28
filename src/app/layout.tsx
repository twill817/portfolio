import type { Metadata } from "next";
import { Inter, Fraunces, Bricolage_Grotesque } from "next/font/google";
import { siteConfig } from "@/content/site";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { themeBootScript } from "@/lib/theme";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SkipLink } from "@/components/layout/SkipLink";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] });
const bricolage = Bricolage_Grotesque({ variable: "--font-bricolage", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — ${siteConfig.role}`,
    template: `%s — ${siteConfig.name}`,
  },
  description: siteConfig.tagline,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${bricolage.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-body antialiased">
        <script dangerouslySetInnerHTML={{ __html: themeBootScript() }} />
        <ThemeProvider>
          <SkipLink />
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
