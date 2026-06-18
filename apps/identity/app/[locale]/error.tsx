"use client";

import { ErrorState } from "@repo/ui";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="p-6">
      <ErrorState
        title="Something went wrong"
        description="We hit a problem signing you in. Please try again."
        action={{ label: "Retry", onClick: reset }}
      />
    </main>
  );
}
