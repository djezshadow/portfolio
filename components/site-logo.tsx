"use client";

import Image from "next/image";
import Link from "next/link";
import { useTheme } from "./theme-provider";

export function SiteLogo({
  locale,
  noirLogoUrl,
  neonLogoUrl,
  size = 24,
  plain = false,
}: {
  locale: string;
  noirLogoUrl: string | null;
  neonLogoUrl: string | null;
  /// Alto en píxeles del logo (o del texto wordmark, escalado a juego).
  size?: number;
  /// true = sin caja/padding propio (para cuando va incrustado en la
  /// portada o en el logo de mobile, que ya no lleva cajita de vidrio).
  plain?: boolean;
}) {
  const { theme } = useTheme();
  const logoUrl = theme === "neon" ? neonLogoUrl : noirLogoUrl;

  return (
    <Link
      href={`/${locale}`}
      data-cursor="magnetic"
      className={
        plain
          ? "inline-flex shrink-0 items-center transition-opacity hover:opacity-80"
          : "flex shrink-0 items-center rounded-full px-3 py-2 transition-colors hover:text-accent"
      }
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt="DJEZSHADOW"
          width={size * 4}
          height={size}
          style={{ height: size, width: "auto" }}
          className="object-contain"
        />
      ) : (
        <span className="font-display tracking-tight" style={{ fontSize: Math.round(size * 0.55) }}>
          DJEZSHADOW
        </span>
      )}
    </Link>
  );
}
