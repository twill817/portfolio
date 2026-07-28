import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { PageHeading } from "./PageHeading";

const meta = {
  title: "UI/PageHeading",
  component: PageHeading,
  tags: ["autodocs"],
} satisfies Meta<typeof PageHeading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    eyebrow: "Work",
    title: "Case studies from 25 years of practice",
    description:
      "A selection of projects across enterprise software, fintech, and healthcare — chosen because the stakes, and the constraints, were real.",
  },
};

export const NoEyebrow: Story = {
  args: {
    title: "About Alex Reyes",
  },
};
