import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
  argTypes: {
    variant: { control: "radio", options: ["primary", "secondary"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: { variant: "primary", children: "View selected work" },
};

export const Secondary: Story = {
  args: { variant: "secondary", children: "Get in touch" },
};

export const Disabled: Story = {
  args: { variant: "primary", children: "Sending…", disabled: true },
};
