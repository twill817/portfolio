export function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-token border border-border px-2.5 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
