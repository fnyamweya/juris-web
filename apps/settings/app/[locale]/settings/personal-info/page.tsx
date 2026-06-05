import type { Locale } from "@repo/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  DataTable,
} from "@repo/ui";
import { preferences } from "@/mock-data";
import { MyAccountPageShell } from "@/components/my-account-page-shell";

export default async function PersonalInfoPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <MyAccountPageShell
      locale={locale}
      breadcrumbLabel="Personal Info"
      title="Personal Info"
      description="Your display name, contact details, and account information."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your personal information on this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <span className="text-sm font-medium">Name</span>
              <span className="rounded-md border px-3 py-2 text-sm">
                Amara Okafor
              </span>
            </div>
            <div className="grid gap-2">
              <span className="text-sm font-medium">Email</span>
              <span className="rounded-md border px-3 py-2 text-sm">
                amara.okafor@example.com
              </span>
            </div>
            <Button>Save</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={["key", "value"]} rows={preferences} />
          </CardContent>
        </Card>
      </div>
    </MyAccountPageShell>
  );
}
