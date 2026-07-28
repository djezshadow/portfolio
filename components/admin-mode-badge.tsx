import { cookies } from "next/headers";
import Link from "next/link";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { LogoutButton } from "./admin/logout-button";

/**
 * Se renderiza en el layout raíz, así que aparece en CUALQUIER página
 * (pública o /admin) mientras haya una sesión de admin activa — un
 * visitante normal (sin sesión) nunca lo ve.
 */
export async function AdminModeBadge() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  const isAdmin = token ? await verifySessionToken(token) : false;

  if (!isAdmin) return null;

  return (
    <div className="glass fixed bottom-4 left-4 z-[150] flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[11px]">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="text-[var(--ink-muted)]">Admin</span>
      <Link href="/admin" data-cursor="magnetic" className="text-accent underline">
        Panel
      </Link>
      <LogoutButton />
    </div>
  );
}
