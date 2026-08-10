"use client";

import { useRouter, usePathname } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Si estabas en el admin, te manda al login. Si estabas viendo el sitio
    // público, te quedás ahí mismo — ahora simplemente como visitante.
    if (pathname.startsWith("/admin")) {
      router.push("/admin/login");
    }
    router.refresh();
  }

  return (
    <button onClick={handleLogout} data-cursor="magnetic" className="font-mono text-xs text-[var(--ink-muted)]">
      Salir
    </button>
  );
}
