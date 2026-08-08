"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "@/components/theme-toggle";

export function AdminNav() {
  const pathname = usePathname();
  if (pathname === "/admin/login") return null;

  return (
    <nav className="glass sticky top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap font-mono text-sm [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link href="/admin" data-cursor="magnetic">Admin</Link>
        <Link href="/admin/categorias" data-cursor="magnetic">Categorías</Link>
        <Link href="/admin/colaboradores" data-cursor="magnetic">Colaboradores</Link>
        <Link href="/admin/tipos-colaborador" data-cursor="magnetic">Tipos de relación</Link>
        <Link href="/admin/configuracion" data-cursor="magnetic">Configuración</Link>
        <Link href="/admin/sobre-mi" data-cursor="magnetic">Sobre mí</Link>
        <Link href="/admin/proyectos/nuevo" data-cursor="magnetic" className="text-accent">
          + Nuevo
        </Link>
        <Link href="/" data-cursor="magnetic" className="text-[var(--ink-muted)]">
          Ver sitio
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </nav>
  );
}
