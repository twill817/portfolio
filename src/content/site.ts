/**
 * Single source of truth for personal/site info.
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
  name: "Tucker Williams",
  role: "Product Experience Designer and Strategist",
  tagline: "25+ years designing products people trust.",
  email: "williams.tucker@gmail.com",
  location: "USA",
  resumeHref: "/resume.pdf",

  shortBio:
    "I've spent the last two and a half decades leading design for enterprise software, fintech, and healthcare products — the kind where a confusing screen has real consequences. These days I split my time between hands-on design work and building the systems and teams that make good design repeatable.",

  longBio: [
    "I started designing for the web in the late 1990s, when \"UX\" wasn't yet a job title — I was a graphic designer who got curious about interaction. Since then I've worked across agency, startup, and enterprise environments, shipping everything from end-to-end e-commerce experiences for both retail and B2B organizations, as well working on user journey and service design optimization.",
    "My focus has always been on the product, finding the balance between business value and user delight. Twenty-five years in, I still think the hardest and most valuable design work is making the complex simple.",
    "For the last decade I've moved increasingly into design leadership — mentoring designers, evolving how work gets done, and working directly with engineering and product leadership to make design a first-class part of how organizations build software. I still make wireframes, but I use tools to quickly turn them into prototypes.",
  ],

  skills: [
    "Product & UX strategy",
    "Enterprise & B2B UX",
    "Accessibility (WCAG AA/AAA)",
    "Design team leadership",
    "Interaction & IA design",
    "Design research",
    "Figma / prototyping",
  ],

  timeline: [
    {
      role: "Product Design Lead",
      org: "ABC Supply Co. Inc.",
      period: "2026",
      description:
        "Leading UX for a new web based application allowing contractors and homeowners to collaborate on exterior materials for a home.",
    },
    {
      role: "Senior UX Strategist",
      org: "Coppel",
      period: "2025",
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
    { label: "Email", href: "mailto:williams.tucker@gmail.com" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/tuckerwilliams/" },
    { label: "Read.cv", href: "https://read.cv/example" },
  ] satisfies SocialLink[],
};
