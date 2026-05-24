"use client";

import { OTPInput, OTPInputContext } from "input-otp";
import { MinusIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useContext } from "react";

import { cn } from "../lib/cn";

export type InputOTPProps = ComponentProps<typeof OTPInput>;

export type InputOTPGroupProps = ComponentProps<"div">;

export type InputOTPSlotProps = ComponentProps<"div"> & {
  index: number;
};

export type InputOTPSeparatorProps = ComponentProps<"div">;

export function InputOTP({
  className,
  containerClassName,
  ...props
}: InputOTPProps) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn(
        "cn-input-otp flex items-center has-disabled:opacity-50",
        containerClassName,
      )}
      spellCheck={false}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

export function InputOTPGroup({ className, ...props }: InputOTPGroupProps) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn(
        "flex items-center rounded-lg",
        "has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20",
        "dark:has-aria-invalid:ring-destructive/40",
        className,
      )}
      {...props}
    />
  );
}

export function InputOTPSlot({
  index,
  className,
  ...props
}: InputOTPSlotProps) {
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive ? "true" : undefined}
      className={cn(
        "relative flex size-8 items-center justify-center border-y border-r border-input text-sm outline-none transition-all",
        "first:rounded-l-lg first:border-l last:rounded-r-lg",
        "aria-invalid:border-destructive",
        "data-[active=true]:ring-3 data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-ring/50",
        "data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20",
        "dark:data-[active=true]:aria-invalid:ring-destructive/40 dark:bg-input/30",
        className,
      )}
      {...props}
    >
      {char}

      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
}

export function InputOTPSeparator({
  className,
  ...props
}: InputOTPSeparatorProps) {
  return (
    <div
      data-slot="input-otp-separator"
      role="separator"
      className={cn(
        "flex items-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MinusIcon aria-hidden="true" />
    </div>
  );
}
