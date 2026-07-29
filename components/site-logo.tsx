"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "./theme-provider";

export function SiteLogo({
  locale,
  noirLogoUrl,
  neonLogoUrl,
}: {
  locale: string;
  noirLogoUrl: string | null;
  neonLogoUrl: string | null;
}) {
  const { theme } = useTheme();
  const logoUrl = theme === "neon" ? neonLogoUrl : noirLogoUrl;

  return (
    <Link
      href={`/${locale}`}
      data-cursor="magnetic"
      className="flex shrink-0 items-center rounded-full px-3 py-2 transition-colors hover:text-accent"
    >
      {logoUrl ? (
        <Image src={logoUrl} alt="DJEZSHADOW" width={110} height={28} className="h-6 w-auto object-contain" />
      ) : (
        <span className="font-display text-base tracking-tight">DJEZSHADOW</span>
      )}
    </Link>
  );
}
