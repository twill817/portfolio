import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { CaseStudyGrid } from "@/components/sections/CaseStudyGrid";
import { LinkButton } from "@/components/ui/Button";
import { siteConfig } from "@/content/site";
import { getFeaturedCaseStudies } from "@/lib/content";

export default function HomePage() {
  const featured = getFeaturedCaseStudies();

  return (
    <>
      <Container as="section" className="py-20 sm:py-28">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          {siteConfig.role}
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight tracking-tight text-foreground sm:text-6xl">
          {siteConfig.tagline}
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
          {siteConfig.shortBio}
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <LinkButton href="/work">View selected work</LinkButton>
          <LinkButton href="/contact" variant="secondary">
            Get in touch
          </LinkButton>
        </div>
      </Container>

      <Container as="section" className="pb-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl text-foreground">Selected work</h2>
          <Link href="/work" className="text-sm text-accent hover:underline underline-offset-4">
            View all work
          </Link>
        </div>
        <CaseStudyGrid caseStudies={featured} />
      </Container>
    </>
  );
}
