import type { Locale } from "@repo/i18n";
import { Button, Card, CardContent } from "@repo/ui";

export default async function UnauthorizedPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <main className="grid min-h-[calc(100dvh-4rem)] place-items-center p-6">
      <Card className="w-full max-w-xl">
        <CardContent className="grid gap-4 p-8 text-center">
          <p className="text-7xl font-semibold tracking-tight">401</p>
          <h1 className="text-xl font-semibold">Unauthorized Access</h1>
          <p className="text-sm text-muted-foreground">
            Please sign in with an account that has permission to access this
            resource.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <Button variant="outline" asChild>
              <a href={`/${locale}/console`}>Go back</a>
            </Button>
            <Button asChild>
              <a href={`/${locale}`}>Home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
