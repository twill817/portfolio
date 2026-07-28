import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Tag } from "./Tag";

const meta = {
  title: "UI/Tag",
  component: Tag,
  tags: ["autodocs"],
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Design Systems" },
};

export const Group: Story = {
  args: { children: "Design Systems" },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag>Enterprise UX</Tag>
      <Tag>Design Systems</Tag>
      <Tag>B2B SaaS</Tag>
    </div>
  ),
};
