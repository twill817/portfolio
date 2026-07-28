export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-6 focus:top-6 focus:z-50 focus:rounded-token focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground"
    >
      Skip to content
    </a>
  );
}
