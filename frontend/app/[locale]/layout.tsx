import { I18nProviderClient } from "@/locales/client";
import type { ReactNode } from "react";

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "fr" }];
}

export default async function LocaleLayout({
  params,
  children,
}: {
  params: Promise<{ locale: string }>;
  children: ReactNode;
}) {
  const { locale } = await params;

  return <I18nProviderClient locale={locale}>{children}</I18nProviderClient>;
}
