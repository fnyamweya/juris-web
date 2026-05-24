"use client";

import type { ComponentProps } from "react";
import { Collapsible as CollapsiblePrimitive } from "radix-ui";

import { cn } from "../lib/cn";

export type CollapsibleProps = ComponentProps<typeof CollapsiblePrimitive.Root>;

export type CollapsibleTriggerProps = ComponentProps<
  typeof CollapsiblePrimitive.CollapsibleTrigger
>;

export type CollapsibleContentProps = ComponentProps<
  typeof CollapsiblePrimitive.CollapsibleContent
>;

export function Collapsible({ className, ...props }: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root
      data-slot="collapsible"
      className={cn(className)}
      {...props}
    />
  );
}

export function CollapsibleTrigger({
  className,
  ...props
}: CollapsibleTriggerProps) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      className={cn(className)}
      {...props}
    />
  );
}

export function CollapsibleContent({
  className,
  ...props
}: CollapsibleContentProps) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      className={cn(className)}
      {...props}
    />
  );
}
