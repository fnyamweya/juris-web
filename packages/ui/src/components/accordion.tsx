"use client";

import type { ComponentProps, ReactNode } from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "../lib/cn";

type AccordionTriggerProps = ComponentProps<
  typeof AccordionPrimitive.Trigger
> & {
  showIcon?: boolean;
  icon?: ReactNode;
  iconClassName?: string;
};

export function Accordion({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Root>) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  );
}

export function AccordionItem({
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

export function AccordionTrigger({
  className,
  children,
  showIcon = true,
  icon,
  iconClassName,
  ...props
}: AccordionTriggerProps) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-start justify-between gap-4 rounded-lg border border-transparent py-2.5 text-left text-sm font-medium outline-none transition-all",
          "hover:underline",
          "focus-visible:ring-3 focus-visible:border-ring focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <span className="min-w-0 flex-1">{children}</span>

        {showIcon && (
          <span
            data-slot="accordion-trigger-icon"
            className={cn(
              "mt-0.5 flex size-4 shrink-0 items-center justify-center text-muted-foreground transition-transform duration-200",
              "group-data-[state=open]:rotate-180",
              iconClassName,
            )}
          >
            {icon ?? <ChevronDownIcon className="size-4" aria-hidden="true" />}
          </span>
        )}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-sm",
        "data-[state=open]:animate-accordion-down",
        "data-[state=closed]:animate-accordion-up",
      )}
      {...props}
    >
      <div
        className={cn(
          "pb-2.5 pt-0",
          "[&_a]:underline-offset-3 [&_a:hover]:text-foreground [&_a]:underline",
          "[&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}
