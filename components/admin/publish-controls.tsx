"use client";

import { useState } from "react";

type Props = {
  defaultState?: "draft" | "now" | "scheduled";
  defaultScheduledFor?: string; // formato datetime-local
};

export function PublishControls({ defaultState = "draft", defaultScheduledFor }: Props) {
  const [state, setState] = useState<"draft" | "now" | "scheduled">(defaultState);

  return (
    <div className="glass space-y-3 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">Publicación</p>
      <div className="flex gap-4 font-mono text-sm">
        {(["draft", "now", "scheduled"] as const).map((opt) => (
          <label key={opt} className="flex items-center gap-2">
            <input
              type="radio"
              name="publishState"
              value={opt}
              checked={state === opt}
              onChange={() => setState(opt)}
            />
            {opt === "draft" ? "Borrador" : opt === "now" ? "Publicar ahora" : "Programar"}
          </label>
        ))}
      </div>

      {state === "scheduled" && (
        <input
          type="datetime-local"
          name="scheduledFor"
          required
          defaultValue={defaultScheduledFor}
          className="rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2 font-mono text-sm"
        />
      )}
    </div>
  );
}
