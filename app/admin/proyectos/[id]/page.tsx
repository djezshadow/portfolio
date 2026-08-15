import Image from "next/image";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateProject, deleteProject, createMediaGroup, renameMediaGroup, deleteMediaGroup, updateMediaGroupCover, moveMediaGroupToProject, moveMediaGroupOrder, updateMediaWatermarkOverride, moveMediaOrder } from "./actions";
import { MediaDropzone } from "@/components/admin/media-dropzone";
import { PublishControls } from "@/components/admin/publish-controls";
import { DeleteButton } from "@/components/admin/delete-button";
import { MediaGroupsPanel } from "@/components/admin/media-groups-panel";
import { SubmitButton } from "@/components/admin/submit-button";
import { WatermarkOverrideForm } from "@/components/admin/watermark-override-form";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { toMonthInputValue } from "@/lib/date-range";

function toDatetimeLocal(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export const dynamic = "force-dynamic";

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [project, categories, collaborators, otherProjectsRaw] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        media: { orderBy: { order: "asc" } },
        mediaGroups: { orderBy: { order: "asc" } },
        categories: true,
      },
    }),
    prisma.category.findMany({ orderBy: { order: "asc" } }),
    prisma.collaborator.findMany({ orderBy: { name: "asc" }, include: { typeOption: true } }),
    prisma.project.findMany({ where: { id: { not: id } }, select: { id: true, title: true }, orderBy: { title: "asc" } }),
  ]);

  if (!project) notFound();

  const currentCategoryId = project.categories[0]?.categoryId ?? "";
  const publishState = !project.publishedAt ? "draft" : project.publishedAt > new Date() ? "scheduled" : "now";

  const action = updateProject.bind(null, project.id);
  const removeAction = deleteProject.bind(null, project.id);

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Editar “{project.title}”</h1>
        <DeleteButton
          action={removeAction}
          confirmText={`¿Borrar "${project.title}" y todas sus fotos/videos? Esto no se puede deshacer.`}
          label="Borrar proyecto"
        />
      </div>

      <div className="mb-6">
        <MediaGroupsPanel
          projectId={project.id}
          groups={project.mediaGroups}
          otherProjects={otherProjectsRaw}
          createAction={createMediaGroup}
          renameAction={renameMediaGroup}
          deleteAction={deleteMediaGroup}
          coverAction={updateMediaGroupCover}
          moveAction={moveMediaGroupToProject}
          reorderAction={moveMediaGroupOrder}
        />
      </div>

      <form action={action} className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Título (Español)</label>
            <input
              name="title"
              required
              defaultValue={project.title}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Título (English) — vacío = usa el español
            </label>
            <input
              name="titleEn"
              defaultValue={project.titleEn ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Descripción ES</label>
            <textarea
              name="description"
              rows={3}
              defaultValue={project.description ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Descripción EN — vacío = usa el ES
            </label>
            <textarea
              name="descriptionEn"
              rows={3}
              defaultValue={project.descriptionEn ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Tu rol (ES)</label>
            <input
              name="role"
              defaultValue={project.role ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
              Tu rol (EN) — vacío = usa el ES
            </label>
            <input
              name="roleEn"
              defaultValue={project.roleEn ?? ""}
              className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Categoría</label>
          <select
            name="categoryId"
            required
            defaultValue={currentCategoryId}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
            Colaboración (opcional)
          </label>
          <select
            name="collaboratorId"
            defaultValue={project.collaboratorId ?? ""}
            className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
          >
            <option value="">Ninguna — trabajo solo en este proyecto</option>
            {collaborators.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({(c.typeOption?.name ?? c.type).toLowerCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="glass space-y-3 rounded-2xl p-4">
          <p className="font-mono text-xs text-[var(--ink-muted)]">Fechas (opcional, tipo CV)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Desde</label>
              <input
                type="month"
                name="dateStart"
                defaultValue={toMonthInputValue(project.dateStart)}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">Hasta</label>
              <input
                type="month"
                name="dateEnd"
                defaultValue={toMonthInputValue(project.dateEnd)}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 font-mono text-sm">
            <input type="checkbox" name="isOngoing" defaultChecked={project.isOngoing} /> Sigo trabajando en
            esto actualmente (ignora "Hasta")
          </label>
        </div>

        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="featured" defaultChecked={project.featured} /> Destacar en el home
        </label>

        <label className="flex items-center gap-2 font-mono text-sm">
          <input type="checkbox" name="showInNav" defaultChecked={project.showInNav} /> Acceso directo en el
          navbar flotante
        </label>

        <div className="glass space-y-3 rounded-2xl p-4">
          <label className="flex items-center gap-2 font-mono text-sm">
            <input type="checkbox" name="isComingSoon" defaultChecked={project.isComingSoon} /> Proyecto en
            pausa — se ve gris/bloqueado (en su categoría y en el navbar si tiene acceso directo), con un
            mensaje al tocarlo. Subilo así mientras terminás el material y destildá esto cuando esté listo.
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
                Mensaje ES (vacío = genérico)
              </label>
              <input
                name="comingSoonHint"
                defaultValue={project.comingSoonHint ?? ""}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] text-[var(--ink-muted)]">
                Mensaje EN — vacío = usa el ES
              </label>
              <input
                name="comingSoonHintEn"
                defaultValue={project.comingSoonHintEn ?? ""}
                className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-3 py-2"
              />
            </div>
          </div>
        </div>

        {project.media.length > 0 && (
          <div className="glass space-y-3 rounded-2xl p-4">
            <p className="font-mono text-xs text-[var(--ink-muted)]">Media actual</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {project.media.map((m, mi) => (
                <div key={m.id} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[var(--ink-muted)]">#{mi + 1}</span>
                    <ReorderButtons
                      onMove={(direction) => moveMediaOrder(m.id, direction)}
                      disableUp={mi === 0}
                      disableDown={mi === project.media.length - 1}
                    />
                  </div>
                  <label className="relative block cursor-pointer">
                    {m.type === "image" ? (
                      <Image
                        src={m.url}
                        alt=""
                        width={150}
                        height={150}
                        className="aspect-square w-full rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center rounded-xl bg-black/30 font-mono text-[10px]">
                        {m.videoProvider?.toUpperCase()}
                      </div>
                    )}
                    <span className="absolute inset-0 flex items-end justify-end rounded-xl bg-black/0 p-1 transition-colors hover:bg-black/40">
                      <input type="checkbox" name="deleteMedia" value={m.id} className="accent-red-500" />
                    </span>
                  </label>
                  {project.mediaGroups.length > 0 && (
                    <select
                      name={`mediaGroup:${m.id}`}
                      defaultValue={m.groupId ?? ""}
                      className="w-full rounded-lg border border-[var(--glass-border)] bg-transparent px-1.5 py-1 font-mono text-[10px]"
                    >
                      <option value="">Sin subcategoría</option>
                      {project.mediaGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <label className="flex items-center gap-1.5 font-mono text-[10px] text-[var(--ink-muted)]">
                    <input
                      type="radio"
                      name="thumbnailMediaId"
                      value={m.id}
                      defaultChecked={m.isThumbnail}
                    />
                    Portada
                  </label>
                  {m.type === "image" && (
                    <WatermarkOverrideForm
                      mediaId={m.id}
                      action={updateMediaWatermarkOverride}
                      initialPosition={m.watermarkPositionOverride}
                      initialOpacity={m.watermarkOpacityOverride}
                    />
                  )}
                </div>
              ))}
            </div>
            <p className="font-mono text-[10px] text-[var(--ink-muted)]">
              Marcá el check sobre una foto/video para borrarla al guardar.
            </p>
          </div>
        )}

        <div>
          <p className="mb-2 font-mono text-xs text-[var(--ink-muted)]">Agregar más fotos (opcional)</p>
          <MediaDropzone />
        </div>


        <PublishControls
          defaultState={publishState}
          defaultScheduledFor={project.publishedAt ? toDatetimeLocal(project.publishedAt) : undefined}
        />

        <SubmitButton>Guardar cambios</SubmitButton>
      </form>
    </div>
  );
}
