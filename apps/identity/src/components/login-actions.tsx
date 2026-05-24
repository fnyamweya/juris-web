"use client";

import { Button } from "@repo/ui";
import { ShieldCheck } from "lucide-react";

export function LoginActions({ locale }: { locale: string }) {
  return (
    <div className="grid gap-3">
      <Button
        type="button"
        onClick={() => {
          window.location.assign("/" + locale + "/console");
        }}
      >
        Continue with mock session
      </Button>
      <Button type="button" variant="outline">
        <ShieldCheck className="h-4 w-4" />
        Enterprise SSO
      </Button>
    </div>
  );
}
