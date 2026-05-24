"use client";

import { Command as CommandPrimitive } from "cmdk";
import { CheckIcon, SearchIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "../lib/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { InputGroup, InputGroupAddon } from "./input-group";

export type CommandProps = ComponentProps<typeof CommandPrimitive>;

export type CommandDialogProps = ComponentProps<typeof Dialog> & {
  title?: string;
  description?: string;
  className?: string;
};

export type CommandInputProps = ComponentProps<typeof CommandPrimitive.Input>;

export type CommandListProps = ComponentProps<typeof CommandPrimitive.List>;

export type CommandEmptyProps = ComponentProps<typeof CommandPrimitive.Empty>;

export type CommandGroupProps = ComponentProps<typeof CommandPrimitive.Group>;

export type CommandSeparatorProps = ComponentProps<
  typeof CommandPrimitive.Separator
>;

export type CommandItemProps = ComponentProps<typeof CommandPrimitive.Item>;

export type CommandShortcutProps = ComponentProps<"span">;

export function Command({ className, ...props }: CommandProps) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-xl bg-popover p-1 text-popover-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  children,
  className,
  ...props
}: CommandDialogProps) {
  return (
    <Dialog {...props}>
      <DialogContent
        className={cn(
          "top-1/3 translate-y-0 overflow-hidden rounded-xl p-0",
          className,
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}

export function CommandInput({ className, ...props }: CommandInputProps) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <InputGroup className="h-8 rounded-lg border-input/30 bg-input/30 shadow-none *:data-[slot=input-group-addon]:pl-2">
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "outline-hidden w-full text-sm disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
          {...props}
        />

        <InputGroupAddon>
          <SearchIcon
            aria-hidden="true"
            className="size-4 shrink-0 opacity-50"
          />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
}

export function CommandList({ className, ...props }: CommandListProps) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "no-scrollbar max-h-72 scroll-py-1 overflow-y-auto overflow-x-hidden outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function CommandEmpty({ className, ...props }: CommandEmptyProps) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm", className)}
      {...props}
    />
  );
}

export function CommandGroup({ className, ...props }: CommandGroupProps) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden p-1 text-foreground",
        "**:[[cmdk-group-heading]]:px-2 **:[[cmdk-group-heading]]:py-1.5",
        "**:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium",
        "**:[[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({
  className,
  ...props
}: CommandSeparatorProps) {
  return (
    <CommandPrimitive.Separator
      data-slot="command-separator"
      className={cn("-mx-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export function CommandItem({
  className,
  children,
  ...props
}: CommandItemProps) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item outline-hidden relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
        "in-data-[slot=dialog-content]:rounded-lg",
        "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
        "data-selected:bg-muted data-selected:text-foreground",
        "data-selected:*:[svg]:text-foreground",
        "[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
        className,
      )}
      {...props}
    >
      {children}

      <CheckIcon
        aria-hidden="true"
        className="group-has-data-[slot=command-shortcut]/command-item:hidden ml-auto opacity-0 group-data-[checked=true]/command-item:opacity-100"
      />
    </CommandPrimitive.Item>
  );
}

export function CommandShortcut({ className, ...props }: CommandShortcutProps) {
  return (
    <span
      data-slot="command-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        "group-data-selected/command-item:text-foreground",
        className,
      )}
      {...props}
    />
  );
}
