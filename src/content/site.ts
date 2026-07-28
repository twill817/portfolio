/**
 * Single source of truth for personal/site info. Everything here is
 * placeholder content for a fictional persona — replace with real details.
 */

export type TimelineEntry = {
  role: string;
  org: string;
  period: string;
  description: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export const siteConfig = {
  name: "Alex Reyes",
  role: "Principal UX Designer",
  tagline: "25+ years designing products people trust with the important parts of their lives.",
  email: "hello@alexreyes.design",
  location: "Portland, Oregon",
  resumeHref: "/resume.pdf",

  shortBio:
    "I've spent the last two and a half decades leading design for enterprise software, fintech, and healthcare products — the kind where a confusing screen has real consequences. These days I split my time between hands-on design work and building the systems and teams that make good design repeatable.",

  longBio: [
    "I started designing for the web in the late 1990s, when \"UX\" wasn't yet a job title — I was a print designer who got curious about interaction. Since then I've worked across agency, startup, and enterprise environments, shipping everything from early e-commerce checkouts to the design systems that now run inside Fortune 500 companies.",
    "My focus has always been on the products where the stakes are real: healthcare platforms where a bad flow means a missed appointment, financial tools where confusion costs someone money, enterprise software that thousands of employees are required to use every day. Twenty-five years in, I still think the hardest and most valuable design work is making complexity feel calm.",
    "For the last decade I've moved increasingly into design leadership — building and mentoring design teams, establishing design systems, and working directly with engineering and product leadership to make design a first-class part of how organizations build software. I still draw my own wireframes.",
  ],

  skills: [
    "Product & UX strategy",
    "Design systems",
    "Enterprise & B2B UX",
    "Accessibility (WCAG AA/AAA)",
    "Design team leadership",
    "Interaction & IA design",
    "Design research",
    "Figma / prototyping",
  ],

  timeline: [
    {
      role: "Principal UX Designer",
      org: "Meridian Health Systems",
      period: "2019 — Present",
      description:
        "Leading UX for the clinician- and patient-facing platforms, and building out the design systems practice across a 40-person product org.",
    },
    {
      role: "Head of Design",
      org: "Northline Financial",
      period: "2013 — 2019",
      description:
        "Built and led a 12-person design team through Northline's shift from legacy desktop software to a modern web and mobile platform.",
    },
    {
      role: "Senior Product Designer",
      org: "Kestrel Software",
      period: "2007 — 2013",
      description:
        "Owned end-to-end UX for Kestrel's flagship enterprise SaaS product, from early sketches through a full design system rollout.",
    },
    {
      role: "Interaction Designer",
      org: "Various agencies",
      period: "1999 — 2007",
      description:
        "Cut my teeth designing e-commerce, marketing, and early web-app experiences across a run of digital agencies during the first wave of the commercial web.",
    },
  ] satisfies TimelineEntry[],

  social: [
    { label: "Email", href: "mailto:hello@alexreyes.design" },
    { label: "LinkedIn", href: "https://linkedin.com/in/example" },
    { label: "Read.cv", href: "https://read.cv/example" },
  ] satisfies SocialLink[],
};
