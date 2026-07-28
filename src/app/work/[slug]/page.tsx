import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Container } from "@/components/layout/Container";
import { Tag } from "@/components/ui/Tag";
import { getAllCaseStudies, getCaseStudyBySlug } from "@/lib/content";

export function generateStaticParams() {
  return getAllCaseStudies().map((caseStudy) => ({ slug: caseStudy.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) return {};
  return { title: caseStudy.title, description: caseStudy.summary };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  return (
    <Container as="article" className="py-16 sm:py-20">
      <p className="text-sm text-muted-foreground">
        {caseStudy.client} &middot; {caseStudy.role} &middot; {caseStudy.year}
      </p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
        {caseStudy.title}
      </h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {caseStudy.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </div>
      <div className="prose mt-12 max-w-none">
        <MDXRemote source={caseStudy.content} />
      </div>
    </Container>
  );
}
