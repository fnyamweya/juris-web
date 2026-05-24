"use client";

import { ErrorState } from "@repo/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="p-6">
      <ErrorState
        title="Something went wrong"
        description={error.message}
        action={{ label: "Retry", onClick: reset }}
      />
    </main>
  );
}
