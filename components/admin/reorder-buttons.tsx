"use client";

import { useState } from "react";

export function ReorderButtons({
  onMove,
  disableUp,
  disableDown,
}: {
  onMove: (direction: "up" | "down") => Promise<void>;
  disableUp?: boolean;
  disableDown?: boolean;
}) {
  const [busy, setBusy] = useState(false);

  async function handle(direction: "up" | "down") {
    setBusy(true);
    try {
      await onMove(direction);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex shrink-0 flex-col gap-0.5" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        data-cursor="magnetic"
        disabled={busy || disableUp}
        onClick={() => handle("up")}
        aria-label="Subir"
        className="flex h-5 w-6 items-center justify-center rounded bg-black/10 text-[10px] disabled:opacity-30"
      >
        ↑
      </button>
      <button
        type="button"
        data-cursor="magnetic"
        disabled={busy || disableDown}
        onClick={() => handle("down")}
        aria-label="Bajar"
        className="flex h-5 w-6 items-center justify-center rounded bg-black/10 text-[10px] disabled:opacity-30"
      >
        ↓
      </button>
    </div>
  );
}
