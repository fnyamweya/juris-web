import { redirect } from "next/navigation";
import type { Locale } from "@repo/i18n";

export default async function LocaleIndex({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect("/" + locale + "/settings");
}
