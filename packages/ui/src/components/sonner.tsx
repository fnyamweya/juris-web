"use client";

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import type { CSSProperties } from "react";

export type SonnerToasterProps = ToasterProps;

export function Toaster(props: SonnerToasterProps) {
  const theme = useTheme().theme;
  const resolvedTheme: "dark" | "light" | "system" =
    theme === "dark" || theme === "light" || theme === "system"
      ? theme
      : "system";

  return (
    <Sonner
      theme={resolvedTheme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon aria-hidden="true" className="size-4" />,
        info: <InfoIcon aria-hidden="true" className="size-4" />,
        warning: <TriangleAlertIcon aria-hidden="true" className="size-4" />,
        error: <OctagonXIcon aria-hidden="true" className="size-4" />,
        loading: (
          <Loader2Icon aria-hidden="true" className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
}
