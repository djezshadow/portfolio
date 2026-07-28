"use client";

export function DeleteButton({
  action,
  confirmText,
  label = "Borrar",
}: {
  action: (formData: FormData) => Promise<void>;
  confirmText: string;
  label?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmText)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        data-cursor="magnetic"
        className="font-mono text-[11px] text-[var(--accent-contrast)] underline"
      >
        {label}
      </button>
    </form>
  );
}
