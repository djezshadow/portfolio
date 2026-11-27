"use client";

import { useEffect, useRef, useState } from "react";
import { PrivateGallery } from "@/components/private-gallery";
import { unlockAlbum } from "./actions";

type Access = { token: string; photos: { id: string; alt: string }[] };

export function AlbumAccess({ id, en }: { id: string; en: boolean }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [error, setError] = useState<"incorrect" | "limited" | "unavailable" | null>(null);
  const [pending, setPending] = useState(false);
  const visit = useRef(0);

  useEffect(() => {
    function reset() {
      visit.current++;
      setAccess(null);
      setError(null);
      setPending(false);
    }
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) reset();
    }
    window.addEventListener("pagehide", reset);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      visit.current++;
      window.removeEventListener("pagehide", reset);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, []);

  async function submit(data: FormData) {
    const currentVisit = visit.current;
    setPending(true);
    setError(null);
    try {
      const result = await unlockAlbum(id, data);
      if (visit.current !== currentVisit) return;
      if (result.error) setError(result.error);
      else setAccess(result);
    } catch {
      if (visit.current === currentVisit) setError("unavailable");
    } finally {
      if (visit.current === currentVisit) setPending(false);
    }
  }

  if (access) return <PrivateGallery photos={access.photos} en={en} token={access.token} />;

  return (
    <form action={submit} className="glass max-w-md space-y-4 rounded-xl p-5">
      <label className="block">
        {en ? "Album password" : "Contraseña del álbum"}
        <input name="password" type="password" required maxLength={72} autoComplete="current-password"
          className="glass mt-2 block w-full rounded-lg px-3 py-2" />
      </label>
      <button disabled={pending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-[var(--bg)] disabled:opacity-50">
        {en ? "Open album" : "Abrir álbum"}
      </button>
      {error && <p role="alert">
        {error === "limited"
          ? (en ? "Too many attempts. Try again in 15 minutes." : "Demasiados intentos. Volvé a probar en 15 minutos.")
          : error === "incorrect"
            ? (en ? "Incorrect password." : "Contraseña incorrecta.")
            : (en ? "Could not open the album." : "No se pudo abrir el álbum.")}
      </p>}
    </form>
  );
}
