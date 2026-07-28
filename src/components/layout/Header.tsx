import Link from "next/link";
import { siteConfig } from "@/content/site";
import { ThemeSwitcher } from "@/components/theme/ThemeSwitcher";
import { Container } from "./Container";

const NAV_LINKS = [
  { href: "/work", label: "Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="border-b border-border">
      <Container className="flex h-20 items-center justify-between gap-6">
        <Link href="/" className="font-display text-lg text-foreground">
          {siteConfig.name}
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-6">
          <ul className="hidden items-center gap-6 sm:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-foreground underline-offset-4 hover:text-accent hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <ThemeSwitcher />
        </nav>
      </Container>
      {/* Mobile nav: shown below the header row on small screens */}
      <Container className="flex gap-5 pb-4 sm:hidden">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className="text-sm text-foreground hover:text-accent">
            {link.label}
          </Link>
        ))}
      </Container>
    </header>
  );
}
