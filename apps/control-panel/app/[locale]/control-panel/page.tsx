import { redirect } from "next/navigation";

export default async function ControlPanelIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/control-panel/overview`);
}
