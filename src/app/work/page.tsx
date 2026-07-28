import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { CaseStudyGrid } from "@/components/sections/CaseStudyGrid";
import { getAllCaseStudies } from "@/lib/content";

export const metadata: Metadata = {
  title: "Work",
  description: "Case studies from 25+ years of UX and product design leadership.",
};

export default function WorkPage() {
  const caseStudies = getAllCaseStudies();

  return (
    <Container as="section" className="py-16 sm:py-20">
      <PageHeading
        eyebrow="Work"
        title="Case studies from 25 years of practice"
        description="A selection of projects across enterprise software, fintech, and healthcare — chosen because the stakes, and the constraints, were real."
      />
      <div className="mt-12">
        <CaseStudyGrid caseStudies={caseStudies} />
      </div>
    </Container>
  );
}
