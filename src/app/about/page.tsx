import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { Tag } from "@/components/ui/Tag";
import { ExperienceTimeline } from "@/components/sections/ExperienceTimeline";
import { LinkButton } from "@/components/ui/Button";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "About",
  description: siteConfig.shortBio,
};

export default function AboutPage() {
  return (
    <Container as="section" className="py-16 sm:py-20">
      <PageHeading eyebrow="About" title={`${siteConfig.name}, ${siteConfig.role}`} />

      <div className="mt-10 flex flex-col gap-5 text-lg leading-relaxed text-muted-foreground">
        {siteConfig.longBio.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        {siteConfig.skills.map((skill) => (
          <Tag key={skill}>{skill}</Tag>
        ))}
      </div>

      <div className="mt-8">
        <LinkButton href={siteConfig.resumeHref}>Download résumé</LinkButton>
      </div>

      <h2 className="mt-20 font-display text-2xl text-foreground">Experience</h2>
      <div className="mt-8">
        <ExperienceTimeline entries={siteConfig.timeline} />
      </div>
    </Container>
  );
}
