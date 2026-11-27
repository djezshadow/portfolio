"use client";

import { useState } from "react";

export function CopyProjectLink({ path }: { path: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");
  return <div className="flex flex-wrap items-center gap-2">
    <button type="button" className="glass rounded-full px-4 py-2" onClick={async () => {
      try {
        await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
        setState("copied");
      } catch {
        setState("error");
      }
    }}>Copiar enlace público</button>
    {state !== "idle" && <span role="status" className="text-sm">
      {state === "copied" ? "Copiado." : "Abrí la ficha para copiar el enlace."}
    </span>}
  </div>;
}
