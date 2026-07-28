import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { siteConfig } from "@/content/site";
import { ExperienceTimeline } from "./ExperienceTimeline";

const meta = {
  title: "Sections/ExperienceTimeline",
  component: ExperienceTimeline,
  tags: ["autodocs"],
  args: { entries: siteConfig.timeline },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ExperienceTimeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
