export const colors = {
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  danger: "hsl(var(--danger))",
  info: "hsl(var(--info))",
  muted: "hsl(var(--muted))",
  accent: "hsl(var(--accent))",
} as const;

export const radius = {
  sm: "0.375rem",
  md: "0.5rem",
  lg: "0.75rem",
} as const;

export const spacing = {
  page: "1.5rem",
  section: "2rem",
} as const;

export const typography = {
  fontSans: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontMono: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
} as const;

export const shadows = {
  soft: "0 1px 2px hsl(var(--foreground) / 0.06)",
  raised: "0 12px 32px hsl(var(--foreground) / 0.12)",
} as const;

export const zIndex = {
  dropdown: 20,
  sticky: 30,
  overlay: 40,
  modal: 50,
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
