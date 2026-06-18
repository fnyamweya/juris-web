"use client";

import { useCallback, useState } from "react";
import { ReauthenticateDialog } from "./reauthenticate-dialog";

type StepUpFetcher = () => Promise<Response>;

interface PendingStepUp {
  retry: StepUpFetcher;
  resolve: (response: Response | null) => void;
}

async function isStepUpRequired(response: Response): Promise<boolean> {
  try {
    const data = (await response.clone().json()) as { error?: { code?: string } };
    return data?.error?.code === "STEP_UP_REQUIRED";
  } catch {
    return false;
  }
}

/**
 * Wraps a fetch call so that a 401 STEP_UP_REQUIRED response (AUTH-004) prompts the user to
 * re-enter their password, then transparently retries the call once reauthenticated. Resolves to
 * `null` if the user cancels the prompt.
 */
export function useStepUp() {
  const [pending, setPending] = useState<PendingStepUp | null>(null);

  const requireStepUp = useCallback(
    async (fetcher: StepUpFetcher): Promise<Response | null> => {
      const response = await fetcher();
      if (response.status !== 401 || !(await isStepUpRequired(response))) {
        return response;
      }
      return new Promise<Response | null>((resolve) => {
        setPending({ retry: fetcher, resolve });
      });
    },
    [],
  );

  const dialog = pending ? (
    <ReauthenticateDialog
      onSuccess={() => {
        const { retry, resolve } = pending;
        setPending(null);
        void retry().then(resolve);
      }}
      onCancel={() => {
        pending.resolve(null);
        setPending(null);
      }}
    />
  ) : null;

  return { requireStepUp, dialog };
}
