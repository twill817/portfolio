import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { FieldError } from "./FieldError";

const meta = {
  title: "UI/FieldError",
  component: FieldError,
  tags: ["autodocs"],
  args: { id: "demo-error" },
} satisfies Meta<typeof FieldError>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithMessage: Story = {
  args: { message: "Please enter your name" },
};

export const NoMessage: Story = {
  args: {},
  parameters: {
    docs: { description: { story: "Renders nothing when there is no error — used inline below every form field." } },
  },
};
