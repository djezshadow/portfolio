"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentProps } from "react";

export function LocaleLink({ locale, onClick, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { locale: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const href = pathname?.replace(/^\/(?:en|es)(?=\/|$)/, `/${locale}`) || `/${locale}`;
  return <Link {...props} href={href} hrefLang={locale}
    onClick={(event) => {
      onClick?.(event);
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const suffix = window.location.search + window.location.hash;
      if (!suffix) return;
      event.preventDefault();
      router.push(href + suffix);
    }} />;
}
