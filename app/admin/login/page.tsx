"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "No se pudo iniciar sesión.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <form onSubmit={handleSubmit} className="glass w-full max-w-sm rounded-2xl p-8">
        <h1 className="font-display text-2xl">Admin</h1>
        <p className="mb-6 text-sm text-[var(--ink-muted)]">DJEZSHADOW®</p>

        <label htmlFor="password" className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 outline-none"
          autoFocus
        />

        {error && <p className="mt-3 text-sm text-[var(--accent-contrast)]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          data-cursor="magnetic"
          className="mt-6 w-full rounded-full bg-[var(--accent)] py-2 font-mono text-sm text-[var(--bg)] disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
