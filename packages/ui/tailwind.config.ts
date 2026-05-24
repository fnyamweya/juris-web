import { tailwindPreset } from "@repo/tokens/tailwind-preset";
import type { Config } from "tailwindcss";

export default {
  presets: [tailwindPreset],
  content: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
} satisfies Config;
