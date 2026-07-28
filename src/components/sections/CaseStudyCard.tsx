import Link from "next/link";
import type { CaseStudy } from "@/lib/content";
import { Tag } from "@/components/ui/Tag";
import { CaseStudyCover } from "./CaseStudyCover";

export function CaseStudyCard({ caseStudy, index }: { caseStudy: CaseStudy; index: number }) {
  return (
    <Link
      href={`/work/${caseStudy.slug}`}
      className="group flex flex-col gap-4 rounded-token focus-visible:outline-2 focus-visible:outline-accent"
    >
      <CaseStudyCover title={caseStudy.title} index={index} />
      <div>
        <p className="text-sm text-muted-foreground">
          {caseStudy.client} &middot; {caseStudy.year}
        </p>
        <h3 className="mt-1 font-display text-xl text-foreground group-hover:text-accent">
          {caseStudy.title}
        </h3>
        <p className="mt-2 text-base leading-relaxed text-muted-foreground">
          {caseStudy.summary}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {caseStudy.tags.map((tag) => (
            <Tag key={tag}>{tag}</Tag>
          ))}
        </div>
      </div>
    </Link>
  );
}
