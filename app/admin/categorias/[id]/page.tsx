import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { updateCategory, deleteCategory } from "../actions";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await prisma.category.findUnique({ where: { id }, include: { style: true } });
  if (!category) notFound();

  const action = updateCategory.bind(null, category.id);
  const removeAction = deleteCategory.bind(null, category.id);

  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-3xl">Editar "{category.name}"</h1>
        <DeleteButton
          action={removeAction}
          confirmText={`¿Borrar la categoría "${category.name}"? Los proyectos no se borran, pero dejan de pertenecer a esta categoría.`}
          label="Borrar categoría"
        />
      </div>
      <CategoryForm
        action={action}
        submitLabel="Guardar cambios"
        defaults={{
          name: category.name,
          nameEn: category.nameEn ?? undefined,
          order: category.order,
          themeMode: category.themeMode,
          themeName: category.themeName ?? undefined,
          metaTitle: category.metaTitle ?? undefined,
          metaTitleEn: category.metaTitleEn ?? undefined,
          metaDescription: category.metaDescription ?? undefined,
          metaDescriptionEn: category.metaDescriptionEn ?? undefined,
          isComingSoon: category.isComingSoon,
          showInNav: category.showInNav,
          comingSoonHint: category.comingSoonHint ?? undefined,
          comingSoonHintEn: category.comingSoonHintEn ?? undefined,
          accentColor: category.style?.accentColor ?? undefined,
          fontFamily: category.style?.fontFamily ?? undefined,
          bold: category.style?.bold,
          strikethrough: category.style?.strikethrough,
          alignment: category.style?.alignment,
          strokeWidth: category.style?.strokeWidth,
        }}
      />
    </div>
  );
}
