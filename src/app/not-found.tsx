import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <Container as="section" className="flex flex-col items-start gap-6 py-24">
      <p className="text-sm font-medium uppercase tracking-wide text-accent">404</p>
      <h1 className="font-display text-4xl text-foreground">Page not found</h1>
      <p className="text-lg text-muted-foreground">
        The page you are looking for does not exist or has moved.
      </p>
      <LinkButton href="/">Back to home</LinkButton>
    </Container>
  );
}
