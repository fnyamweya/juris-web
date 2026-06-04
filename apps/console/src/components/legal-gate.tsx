import { createCivisClient } from "@repo/civis";
import type { LegalDocument } from "@repo/civis";
import { LegalAcceptanceFlow } from "./legal-acceptance-flow";

export async function LegalGate({ children, locale }: { children: React.ReactNode; locale: string }) {
  let pendingDocs: LegalDocument[] = [];
  try {
    const client = await createCivisClient();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    pendingDocs = (await (client.me.legal as { pending: () => Promise<LegalDocument[]> }).pending());
  } catch {
    // Not authenticated — render children, page-level guard will redirect
  }

  if (pendingDocs.length > 0) {
    return <LegalAcceptanceFlow documents={pendingDocs} locale={locale}>{children}</LegalAcceptanceFlow>;
  }

  return children;
}
