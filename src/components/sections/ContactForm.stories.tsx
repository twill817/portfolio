import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ContactForm } from "./ContactForm";

const meta = {
  title: "Sections/ContactForm",
  component: ContactForm,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Submitting here calls the real /api/contact route — in Storybook (no server) it will show the client-side validation states, but a submit with valid input will fail the fetch since there's no API route to hit.",
      },
    },
  },
} satisfies Meta<typeof ContactForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
