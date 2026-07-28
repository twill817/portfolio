import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CaseStudy } from "@/lib/content";
import { CaseStudyGrid } from "./CaseStudyGrid";

const mockCaseStudies: CaseStudy[] = [
  {
    title: "Redesigning a 15-Year-Old Platform Without Stopping the Trains",
    slug: "enterprise-platform-redesign",
    client: "Kestrel Software",
    role: "Senior Product Designer",
    year: "2011",
    summary: "Modernizing a mission-critical enterprise SaaS product used by 200,000 daily active users.",
    tags: ["Enterprise UX", "Design Systems", "B2B SaaS"],
    order: 1,
    featured: true,
    content: "",
  },
  {
    title: "Rebuilding Trust in a Banking App After a Failed Redesign",
    slug: "fintech-trust-rebuild",
    client: "Northline Financial",
    role: "Head of Design",
    year: "2015",
    summary: "Winning customers back after a redesign that shipped fast and broke trust.",
    tags: ["Fintech", "Mobile", "Design Leadership"],
    order: 2,
    featured: true,
    content: "",
  },
  {
    title: "Making a Clinical Scheduling Tool Accessible Without Slowing Clinicians Down",
    slug: "clinical-scheduling-accessibility",
    client: "Meridian Health Systems",
    role: "Principal UX Designer",
    year: "2021",
    summary: "An accessibility overhaul designed so compliance work made the product faster for everyone.",
    tags: ["Healthcare", "Accessibility", "Enterprise UX"],
    order: 3,
    featured: true,
    content: "",
  },
];

const meta = {
  title: "Sections/CaseStudyGrid",
  component: CaseStudyGrid,
  tags: ["autodocs"],
  args: { caseStudies: mockCaseStudies },
} satisfies Meta<typeof CaseStudyGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
