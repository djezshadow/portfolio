"use client";

import { useState } from "react";
import { compressImageForUpload } from "@/lib/compress-image";

export function AlbumForm({ action, children, label, confirmMessage, photo }: {
  action: (data: FormData) => Promise<void>;
  children?: React.ReactNode;
  label: string;
  confirmMessage?: string;
  photo?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  return <form className="flex flex-wrap items-center gap-3" onSubmit={async (event) => {
    event.preventDefault();
    if (pending || (confirmMessage && !window.confirm(confirmMessage))) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    setMessage("");
    try {
      if (photo) {
        const files = data.getAll("photo").filter((file): file is File => file instanceof File && file.size > 0);
        let uploaded = 0;
        const failed: string[] = [];
        for (const [index, file] of files.entries()) {
          setMessage(`Procesando foto ${index + 1} de ${files.length}…`);
          try {
            data.set("photo", await compressImageForUpload(file, { maxWidth: 2400, maxHeight: 2400, requireWebp: true }));
            await action(data);
            uploaded++;
          } catch {
            failed.push(file.name);
          }
        }
        form.reset();
        setMessage(`Fotos guardadas: ${uploaded}.${failed.length ? ` Volvé a seleccionar las que fallaron: ${failed.join(", ")}.` : ""}`);
      } else {
        await action(data);
        form.reset();
        setMessage("Guardado.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la acción.");
    } finally {
      setPending(false);
    }
  }}>
    {children}
    <button disabled={pending} className="glass rounded-lg px-4 py-2 disabled:opacity-50">{pending ? "Procesando…" : label}</button>
    {message && <p role="status" className="w-full text-sm">{message}</p>}
  </form>;
}
