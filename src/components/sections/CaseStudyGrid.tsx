import type { CaseStudy } from "@/lib/content";
import { CaseStudyCard } from "./CaseStudyCard";

export function CaseStudyGrid({ caseStudies }: { caseStudies: CaseStudy[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2">
      {caseStudies.map((caseStudy, index) => (
        <CaseStudyCard key={caseStudy.slug} caseStudy={caseStudy} index={index} />
      ))}
    </div>
  );
}
