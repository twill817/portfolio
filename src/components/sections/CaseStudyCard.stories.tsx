import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { CaseStudy } from "@/lib/content";
import { CaseStudyCard } from "./CaseStudyCard";

// Mock data — lib/content.ts reads the filesystem (Node-only), so stories
// use hand-written fixtures instead of the real MDX loader.
const mockCaseStudy: CaseStudy = {
  title: "Redesigning a 15-Year-Old Platform Without Stopping the Trains",
  slug: "enterprise-platform-redesign",
  client: "Kestrel Software",
  role: "Senior Product Designer",
  year: "2011",
  summary:
    "Modernizing a mission-critical enterprise SaaS product used by 200,000 daily active users — without a single day of downtime.",
  tags: ["Enterprise UX", "Design Systems", "B2B SaaS"],
  order: 1,
  featured: true,
  content: "",
};

const meta = {
  title: "Sections/CaseStudyCard",
  component: CaseStudyCard,
  tags: ["autodocs"],
  args: { caseStudy: mockCaseStudy, index: 0 },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CaseStudyCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
