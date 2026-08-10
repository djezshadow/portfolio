"use client";

export function CoverImageForm({
  action,
  currentUrl,
  label,
}: {
  action: (formData: FormData) => Promise<void>;
  currentUrl: string | null;
  label: string;
}) {
  return (
    <form action={action} className="glass space-y-3 rounded-2xl p-4">
      <p className="font-mono text-xs text-[var(--ink-muted)]">{label}</p>

      {currentUrl && (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={currentUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
          <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
            <input type="checkbox" name="removeImage" /> Quitar portada
          </label>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <input type="file" name="image" accept="image/*" className="font-mono text-sm" />
        <button
          type="submit"
          data-cursor="magnetic"
          className="rounded-full bg-[var(--accent)] px-4 py-1.5 font-mono text-[11px] text-[var(--bg)]"
        >
          Guardar portada
        </button>
      </div>
    </form>
  );
}
