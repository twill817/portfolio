/**
 * Decorative placeholder cover — no real case-study photography yet.
 * Swap for a real `next/image` once art is available; this keeps every
 * brand/theme combination looking intentional in the meantime.
 */
export function CaseStudyCover({ title, index }: { title: string; index: number }) {
  const patterns = [
    "linear-gradient(135deg, var(--color-accent) 0%, transparent 60%)",
    "radial-gradient(circle at 30% 30%, var(--color-accent) 0%, transparent 55%)",
    "linear-gradient(45deg, transparent 40%, var(--color-accent) 100%)",
  ];

  return (
    <div
      role="img"
      aria-label={`Cover artwork for ${title}`}
      className="aspect-[16/10] w-full overflow-hidden rounded-token border border-border bg-surface"
      style={{ backgroundImage: patterns[index % patterns.length], backgroundColor: "var(--color-surface)" }}
    />
  );
}
