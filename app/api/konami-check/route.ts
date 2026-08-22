import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

function getClientIp(req: Request): string {
  // Vercel pone la IP real acá — puede venir una lista separada por
  // comas (proxies encadenados), la primera es la del visitante.
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Pedido: "el logro me gustaría que por IP solo salga una vez". Guarda
 * un hash de la IP (no la IP en texto plano) la primera vez que alguien
 * completa el código Konami; si ya existe, no vuelve a mostrarse desde
 * esa IP, sin importar si cambia de navegador o borra cookies.
 */
export async function POST(req: Request) {
  const ip = getClientIp(req);
  const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

  try {
    const existing = await prisma.konamiUnlock.findUnique({ where: { ipHash } });
    if (existing) {
      return NextResponse.json({ alreadySeen: true }, { headers: { "Cache-Control": "no-store" } });
    }

    await prisma.konamiUnlock.create({ data: { ipHash } });
  } catch (err) {
    // Si la tabla todavía no existe (falta prisma db push) u otro error
    // de infraestructura, no bloqueamos el easter egg — mejor mostrarlo
    // de más que romper la experiencia por un detalle de tracking.
    console.error("Error en /api/konami-check:", err);
  }

  const settings = await getSiteSettings();
  return NextResponse.json(
    {
      alreadySeen: false,
      message: settings.konamiMessage,
      messageEn: settings.konamiMessageEn,
      soundUrl: settings.konamiSoundUrl,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
