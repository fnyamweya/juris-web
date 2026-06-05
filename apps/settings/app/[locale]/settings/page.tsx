import type { Locale } from "@repo/i18n";
import { redirect } from "next/navigation";

export default async function SettingsIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/settings/personal-info`);
}
