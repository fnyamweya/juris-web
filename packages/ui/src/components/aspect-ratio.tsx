"use client";

import type { ComponentProps } from "react";
import { AspectRatio as AspectRatioPrimitive } from "radix-ui";

import { cn } from "../lib/cn";

export type AspectRatioProps = ComponentProps<typeof AspectRatioPrimitive.Root>;

export function AspectRatio({ className, ...props }: AspectRatioProps) {
  return (
    <AspectRatioPrimitive.Root
      data-slot="aspect-ratio"
      className={cn("overflow-hidden", className)}
      {...props}
    />
  );
}
