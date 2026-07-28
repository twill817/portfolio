import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ThemeProvider } from "./ThemeProvider";
import { ThemeSwitcher } from "./ThemeSwitcher";

const meta = {
  title: "Theme/ThemeSwitcher",
  component: ThemeSwitcher,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          "Fully interactive here — click a brand or the mode toggle. Note this manages its own state via ThemeProvider (localStorage-backed), which will briefly fight the global Brand/Theme toolbar above; use the buttons in this story to drive state, not the toolbar.",
      },
    },
  },
} satisfies Meta<typeof ThemeSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
