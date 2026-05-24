import { tailwindPreset } from "@repo/tokens/tailwind-preset";
import type { Config } from "tailwindcss";

export default {
  presets: [tailwindPreset],
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
