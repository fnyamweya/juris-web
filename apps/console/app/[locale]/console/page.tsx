import { redirect } from "next/navigation";
import type { Locale } from "@repo/i18n";

export default async function ConsoleIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/console/overview`);
}
