import type { TimelineEntry } from "@/content/site";

export function ExperienceTimeline({ entries }: { entries: TimelineEntry[] }) {
  return (
    <ol className="flex flex-col gap-8 border-l border-border pl-6">
      {entries.map((entry) => (
        <li key={`${entry.org}-${entry.period}`} className="relative">
          <span className="absolute -left-[1.65rem] top-1.5 h-2.5 w-2.5 rounded-full bg-accent" />
          <p className="text-sm text-muted-foreground">{entry.period}</p>
          <h3 className="mt-1 font-display text-lg text-foreground">
            {entry.role} &middot; {entry.org}
          </h3>
          <p className="mt-1 leading-relaxed text-muted-foreground">{entry.description}</p>
        </li>
      ))}
    </ol>
  );
}
