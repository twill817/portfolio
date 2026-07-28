import { siteConfig } from "@/content/site";
import { Container } from "./Container";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-border">
      <Container className="flex flex-col gap-4 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {year} {siteConfig.name}. {siteConfig.location}.
        </p>
        <ul className="flex gap-5">
          {siteConfig.social.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="hover:text-accent hover:underline underline-offset-4">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </footer>
  );
}
