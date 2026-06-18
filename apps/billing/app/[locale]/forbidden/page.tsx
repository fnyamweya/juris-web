import type { Locale } from "@repo/i18n";
import { AccessDeniedState } from "@repo/ui";

export default async function ForbiddenPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <AccessDeniedState
        title="Access denied"
        description="You don't have permission to view this page. Contact your administrator if you think this is a mistake."
        action={{ label: "Back to billing", href: `/${locale}/billing` }}
      />
    </main>
  );
}
