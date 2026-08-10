import { getProfile } from "@/lib/profile";
import { updateProfile, createSkill, deleteSkill, createExperience, updateExperience, deleteExperience } from "./actions";
import { SubmitButton } from "@/components/admin/submit-button";
import { SkillsPanel } from "@/components/admin/skills-panel";
import { ExperiencePanel } from "@/components/admin/experience-panel";

export const dynamic = "force-dynamic";

export default async function AdminCvPage() {
  const profile = await getProfile();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="mb-2 font-display text-3xl">CV</h1>
      <p className="mb-8 font-mono text-xs text-[var(--ink-muted)]">
        Datos para el CV descargable del sitio público. El CV suma automáticamente tus proyectos
        del portfolio (con las fechas que les cargaste), así que no hace falta repetirlos acá —
        esto es para el resto: quién sos, tu experiencia laboral fuera del portfolio, y tus
        aptitudes. Por privacidad, el teléfono y la dirección quedan vacíos y fuera del CV a
        menos que vos mismo los completes.
      </p>

      <form action={updateProfile} className="mb-10 space-y-4">
        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="cvEnabled" defaultChecked={profile.cvEnabled} />
          Mostrar el botón "Descargar CV" en el sitio público
        </label>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Foto (opcional)</label>
          {profile.photoUrl && (
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={profile.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
              <label className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-muted)]">
                <input type="checkbox" name="removePhoto" /> Quitar foto
              </label>
            </div>
          )}
          <input type="file" name="photo" accept="image/*" className="font-mono text-sm" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Nombre completo</label>
            <input name="fullName" defaultValue={profile.fullName ?? ""} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
          <div />
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Especialidad (ES)</label>
            <input name="specialty" defaultValue={profile.specialty ?? ""} placeholder="Ej: Filmmaker & Editor" className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Especialidad (EN)</label>
            <input name="specialtyEn" defaultValue={profile.specialtyEn ?? ""} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Bio corta (ES)</label>
            <textarea name="bio" defaultValue={profile.bio ?? ""} rows={4} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Bio corta (EN)</label>
            <textarea name="bioEn" defaultValue={profile.bioEn ?? ""} rows={4} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Mail (opcional, para el CV)</label>
            <input name="email" type="email" defaultValue={profile.email ?? ""} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Website (opcional)</label>
            <input name="website" defaultValue={profile.website ?? ""} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
          </div>
        </div>

        <div className="rounded-xl border border-[var(--glass-border)] p-3">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-[var(--ink-muted)]">
            Opcional — vacío por defecto, el CV no los muestra si no completás nada acá
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Teléfono</label>
              <input name="phone" defaultValue={profile.phone ?? ""} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Dirección</label>
              <input name="address" defaultValue={profile.address ?? ""} className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2" />
            </div>
          </div>
        </div>

        <SubmitButton>Guardar datos del CV</SubmitButton>
      </form>

      <div className="mb-10">
        <h2 className="mb-3 font-display text-xl">Aptitudes</h2>
        <SkillsPanel skills={profile.skills} createAction={createSkill} deleteAction={deleteSkill} />
      </div>

      <div>
        <h2 className="mb-3 font-display text-xl">Experiencia laboral</h2>
        <ExperiencePanel
          experiences={profile.experiences}
          createAction={createExperience}
          updateAction={updateExperience}
          deleteAction={deleteExperience}
        />
      </div>
    </div>
  );
}
